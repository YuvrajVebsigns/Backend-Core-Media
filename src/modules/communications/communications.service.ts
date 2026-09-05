import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  CommunicationLog,
  CommunicationChannel,
  CommunicationStatus,
} from './schemas/communication-log.schema';
import { WebhookSubscription } from './schemas/webhook-subscription.schema';
import { CommunicationProvider } from './schemas/communication-provider.schema';
import { MessageTemplate } from './schemas/message-template.schema';
import { EventTemplateMapping } from './schemas/event-template-mapping.schema';
import {
  CreateEventTemplateMappingDto,
  UpdateEventTemplateMappingDto,
} from './dto/event-template-mapping.dto';
import {
  QueryCommunicationLogDto,
  SendManualMessageDto,
} from './dto/communication-log.dto';
import {
  CreateWebhookSubscriptionDto,
  UpdateWebhookSubscriptionDto,
  QueryWebhookSubscriptionDto,
} from './dto/webhook-subscription.dto';
import {
  CreateCommunicationProviderDto,
  UpdateCommunicationProviderDto,
  CreateBrevoSenderDto,
} from './dto/communication-provider.dto';
import { SendTemplateMessageDto } from './dto/message-template.dto';
import { BrevoWebhookEventDto } from './dto/brevo-webhook.dto';
import { ProviderRegistryService } from './providers/provider-registry.service';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';
import { BrevoEmailProvider } from './providers/brevo-email.provider';
import { VariableResolverService } from './services/variable-resolver.service';

function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  if (!obj || typeof obj !== 'object') return result;

  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (
      val &&
      typeof val === 'object' &&
      !(val instanceof Date) &&
      !(val as any)._bsontype &&
      (val as any).constructor?.name !== 'ObjectID' &&
      (val as any).constructor?.name !== 'ObjectId'
    ) {
      if (Array.isArray(val)) {
        // Flatten index-based: e.g. nominees.0.nomineeId.name
        val.forEach((item, idx) => {
          Object.assign(result, flattenObject(item, `${fullKey}.${idx}`));
        });
        // Flatten index-less using each item (last item/latest will overwrite, but for 1-element arrays it's exact)
        val.forEach((item) => {
          Object.assign(result, flattenObject(item, fullKey));
        });
      } else {
        Object.assign(result, flattenObject(val, fullKey));
      }
    } else {
      result[fullKey] = val;
    }
  }
  return result;
}

@Injectable()
export class CommunicationsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(
    @InjectModel(CommunicationLog.name)
    private readonly logModel: Model<CommunicationLog>,
    @InjectModel(WebhookSubscription.name)
    private readonly webhookSubscriptionModel: Model<WebhookSubscription>,
    @InjectModel(CommunicationProvider.name)
    private readonly providerModel: Model<CommunicationProvider>,
    @InjectModel(MessageTemplate.name)
    private readonly templateModel: Model<MessageTemplate>,
    @InjectModel(EventTemplateMapping.name)
    private readonly eventMappingModel: Model<EventTemplateMapping>,
    @InjectQueue('communications')
    private readonly communicationsQueue: Queue,
    @Inject(forwardRef(() => ProviderRegistryService))
    private readonly providerRegistry: ProviderRegistryService,
    private readonly variableResolverService: VariableResolverService,
  ) {}

  async onApplicationBootstrap() {
    try {
      const db = this.eventMappingModel.db;
      await db.collection('event_template_mappings').dropIndex('event_1');
      this.logger.log(
        'Successfully dropped old event_1 unique index on event_template_mappings.',
      );
    } catch (error) {
      this.logger.debug(
        `Index event_1 drop result (safe if index does not exist): ${error.message}`,
      );
    }
  }

  /**
   * Helper to dispatch any notification type through the background queue.
   * Creates a pending log first and pushes a delivery job.
   */
  async dispatch(
    channel: CommunicationChannel,
    recipient: string,
    title: string,
    content: string,
    metadata?: Record<string, any>,
    cc?: string,
    bcc?: string,
  ): Promise<CommunicationLog> {
    const logMetadata = {
      ...(metadata || {}),
      ...(cc ? { cc } : {}),
      ...(bcc ? { bcc } : {}),
    };

    const log = new this.logModel({
      channel,
      recipient,
      title,
      content,
      status: CommunicationStatus.PENDING,
      metadata: logMetadata,
    });
    const savedLog = await log.save();

    await this.communicationsQueue.add(
      `send-${channel}`,
      {
        logId: savedLog._id.toString(),
        channel,
        recipient,
        title,
        content,
        metadata: logMetadata,
        cc,
        bcc,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.debug(
      `Dispatched CommunicationLog: ${savedLog._id} [Channel: ${channel}, Recipient: ${recipient}]`,
    );

    return savedLog;
  }

  async getAdminEmail(): Promise<string> {
    const brevo = await this.providerModel.findOne({ name: 'brevo', isDeleted: null }).exec();
    if (brevo && brevo.config && typeof brevo.config.adminEmail === 'string') {
      return brevo.config.adminEmail;
    }
    return '';
  }

  /**
   * Executing templates for workflows lacking NestJS system event hooks.
   */
  async dispatchUnmappedTemplate(
    templateSlug: string,
    queryPayloadContext: any,
    targetOverride?: string | string[],
  ): Promise<CommunicationLog[]> {
    const template = await this.templateModel
      .findOne({ slug: templateSlug, isActive: true, isDeleted: null })
      .exec();
    if (!template) {
      throw new NotFoundException(
        `Active template with slug "${templateSlug}" not found.`,
      );
    }

    let recipients: string[] = [];
    if (targetOverride) {
      recipients = Array.isArray(targetOverride) ? targetOverride : [targetOverride];
    } else {
      const targetPath =
        (template as any).to ||
        template.get('to') ||
        (template as any).metadata?.to ||
        template.get('metadata')?.to ||
        (template as any).target ||
        template.get('target');

      if (targetPath) {
        const resolved = this.variableResolverService.resolvePath(
          queryPayloadContext,
          targetPath,
        );
        if (resolved) {
          recipients = Array.isArray(resolved) ? resolved : [resolved];
        }
      }
    }

    if (recipients.length === 0) {
      this.logger.warn(
        `No recipients resolved for unmapped template execution: ${templateSlug}`,
      );
      return [];
    }

    const logs: CommunicationLog[] = [];
    for (const recipient of recipients) {
      const interpolatedSubject = this.variableResolverService.interpolate(
        template.subject || '',
        queryPayloadContext,
      );

      const contentTemplate =
        template.htmlContent || template.textContent || '';
      const interpolatedContent = this.variableResolverService.interpolate(
        contentTemplate,
        queryPayloadContext,
      );

      const log = await this.dispatch(
        template.channel,
        recipient,
        interpolatedSubject,
        interpolatedContent,
        {
          templateSlug,
          senderEmail: template.senderEmail,
          senderName: template.senderName,
          unmappedExecution: true,
        },
      );
      logs.push(log);
    }
    return logs;
  }

  /**
   * Helper to dispatch template-based messages.
   * Resolves active provider, formats the subject, records log, and adds to queue.
   */
  async dispatchTemplateMessage(
    dto: SendTemplateMessageDto,
  ): Promise<CommunicationLog> {
    const template = await this.templateModel
      .findOne({ slug: dto.slug, isDeleted: null })
      .exec();
    if (!template) {
      throw new NotFoundException(
        `Template with slug "${dto.slug}" not found.`,
      );
    }

    const provider = await this.providerRegistry.resolveActiveProvider(
      template.channel,
    );
    if (!provider) {
      throw new Error(
        `No active / enabled provider plugin found for channel ${template.channel}. Ensure feature flags are enabled.`,
      );
    }

    // Format subject with template params (handling flattened nested paths)
    const flatParams = flattenObject(dto.params);
    const combinedParams = { ...dto.params, ...flatParams };
    let subject = template.subject || '';
    for (const [key, val] of Object.entries(combinedParams)) {
      if (typeof val === 'object' && val !== null) continue;
      const strVal = String(val ?? '');
      subject = subject.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), strVal);
      subject = subject.replace(
        new RegExp(`{{\\s*params.${key}\\s*}}`, 'g'),
        strVal,
      );
    }

    // Create pending log
    const finalSenderEmail = dto.senderEmail || template.senderEmail;
    const finalSenderName = dto.senderName || template.senderName;

    // Create pending log
    const log = new this.logModel({
      channel: template.channel,
      recipient: dto.recipient,
      title: subject,
      content: `[Template slug: ${dto.slug}] Variables: ${JSON.stringify(dto.params)}`,
      status: CommunicationStatus.PENDING,
      metadata: {
        templateSlug: dto.slug,
        params: dto.params,
        recipientName: dto.recipientName,
        providerName: provider.name,
        cc: dto.cc,
        bcc: dto.bcc,
        ...(finalSenderEmail
          ? { senderEmail: finalSenderEmail, senderName: finalSenderName }
          : {}),
      },
    });
    const savedLog = await log.save();

    const externalTemplateId =
      template.providerSync?.[provider.name]?.templateId;

    // Dispatch Bull job
    await this.communicationsQueue.add(
      `send-template-${template.channel}`,
      {
        logId: savedLog._id.toString(),
        channel: template.channel,
        recipient: dto.recipient,
        recipientName: dto.recipientName,
        templateSlug: dto.slug,
        externalTemplateId,
        params: dto.params,
        senderEmail: finalSenderEmail,
        senderName: finalSenderName,
        cc: dto.cc,
        bcc: dto.bcc,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.debug(
      `Dispatched template-based CommunicationLog: ${savedLog._id} [Template: ${dto.slug}, Channel: ${template.channel}, Recipient: ${dto.recipient}]`,
    );

    return savedLog;
  }

  // Internal high-level APIs
  async sendEmail(
    to: string,
    subject: string,
    body: string,
    metadata?: Record<string, any>,
  ) {
    return this.dispatch(
      CommunicationChannel.EMAIL,
      to,
      subject,
      body,
      metadata,
    );
  }

  async sendSms(to: string, message: string, metadata?: Record<string, any>) {
    return this.dispatch(CommunicationChannel.SMS, to, '', message, metadata);
  }

  async sendPush(
    token: string,
    title: string,
    body: string,
    metadata?: Record<string, any>,
  ) {
    return this.dispatch(
      CommunicationChannel.PUSH,
      token,
      title,
      body,
      metadata,
    );
  }

  /**
   * Triggers active webhook subscriptions that match a given system event name (or * wildcard).
   */
  async triggerWebhook(event: string, payload: any) {
    const subscriptions = await this.webhookSubscriptionModel
      .find({ isActive: true, isDeleted: null })
      .exec();

    const matchedSubs = subscriptions.filter(
      (sub) => sub.events.includes('*') || sub.events.includes(event),
    );

    this.logger.debug(
      `Triggering webhook for event "${event}". Found ${matchedSubs.length} matching subscriptions.`,
    );

    for (const sub of matchedSubs) {
      await this.dispatch(
        CommunicationChannel.WEBHOOK,
        sub.url,
        event,
        JSON.stringify(payload),
        {
          webhookSubscriptionId: sub._id.toString(),
          secret: sub.secret,
          event,
        },
      );
    }
  }

  // Admin APIs: Communication Logs
  async findAllLogs(
    queryDto: QueryCommunicationLogDto,
  ): Promise<PaginatedResponseDto<CommunicationLog>> {
    const { page = 1, limit = 10, search, channel, status } = queryDto;
    const skip = (page - 1) * limit;

    const matchQuery: any = { isDeleted: null };

    if (channel) {
      matchQuery.channel = channel;
    }

    if (status) {
      matchQuery.status = status;
    }

    if (search) {
      matchQuery.$or = [
        { recipient: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.logModel
        .find(matchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.logModel.countDocuments(matchQuery).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOneLog(id: string): Promise<CommunicationLog> {
    const log = await this.logModel
      .findOne({ _id: id, isDeleted: null })
      .exec();
    if (!log) {
      throw new NotFoundException(`Communication log with ID ${id} not found`);
    }
    return log;
  }

  // Provider CRUD APIs
  async createProvider(
    dto: CreateCommunicationProviderDto,
  ): Promise<CommunicationProvider> {
    const provider = new this.providerModel(dto);
    const saved = await provider.save();
    await this.providerRegistry.reloadProviders();
    return saved;
  }

  async updateProvider(
    id: string,
    dto: UpdateCommunicationProviderDto,
  ): Promise<CommunicationProvider> {
    const provider = await this.providerModel
      .findOneAndUpdate({ _id: id, isDeleted: null }, dto, { new: true })
      .exec();

    if (!provider) {
      throw new NotFoundException(
        `Communication provider with ID ${id} not found`,
      );
    }

    await this.providerRegistry.reloadProviders();
    return provider;
  }

  async removeProvider(id: string): Promise<void> {
    const result = await this.providerModel
      .updateOne({ _id: id }, { isDeleted: new Date() })
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException(
        `Communication provider with ID ${id} not found`,
      );
    }

    await this.providerRegistry.reloadProviders();
  }

  // Admin APIs: Webhook Subscriptions
  async createWebhookSubscription(
    dto: CreateWebhookSubscriptionDto,
  ): Promise<WebhookSubscription> {
    const sub = new this.webhookSubscriptionModel(dto);
    return sub.save();
  }

  async findAllWebhookSubscriptions(
    queryDto: QueryWebhookSubscriptionDto,
  ): Promise<PaginatedResponseDto<WebhookSubscription>> {
    const { page = 1, limit = 10, search, isActive } = queryDto;
    const skip = (page - 1) * limit;

    const matchQuery: any = { isDeleted: null };

    if (isActive !== undefined) {
      matchQuery.isActive = isActive;
    }

    if (search) {
      matchQuery.url = { $regex: search, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      this.webhookSubscriptionModel
        .find(matchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.webhookSubscriptionModel.countDocuments(matchQuery).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOneWebhookSubscription(id: string): Promise<WebhookSubscription> {
    const sub = await this.webhookSubscriptionModel
      .findOne({ _id: id, isDeleted: null })
      .exec();
    if (!sub) {
      throw new NotFoundException(
        `Webhook subscription with ID ${id} not found`,
      );
    }
    return sub;
  }

  async updateWebhookSubscription(
    id: string,
    dto: UpdateWebhookSubscriptionDto,
  ): Promise<WebhookSubscription> {
    const sub = await this.webhookSubscriptionModel
      .findOneAndUpdate({ _id: id, isDeleted: null }, dto, {
        new: true,
      })
      .exec();

    if (!sub) {
      throw new NotFoundException(
        `Webhook subscription with ID ${id} not found`,
      );
    }
    return sub;
  }

  async removeWebhookSubscription(id: string): Promise<void> {
    const result = await this.webhookSubscriptionModel
      .updateOne({ _id: id }, { isDeleted: new Date() })
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException(
        `Webhook subscription with ID ${id} not found`,
      );
    }
  }

  // ─── Brevo Webhook Event Handler ────────────────────────────────────

  /**
   * Brevo event → CommunicationLog status mapping:
   */
  private static readonly BREVO_STATUS_MAP: Record<
    string,
    CommunicationStatus | null
  > = {
    request: CommunicationStatus.REQUESTED,
    deferred: CommunicationStatus.PENDING,
    delivered: CommunicationStatus.DELIVERED,
    opened: CommunicationStatus.OPENED,
    unique_opened: CommunicationStatus.OPENED,
    proxy_open: CommunicationStatus.OPENED,
    unique_proxy_open: CommunicationStatus.OPENED,
    click: CommunicationStatus.CLICKED,
    hard_bounce: CommunicationStatus.BOUNCED,
    soft_bounce: CommunicationStatus.BOUNCED,
    blocked: CommunicationStatus.BLOCKED,
    spam: CommunicationStatus.SPAM,
    invalid_email: CommunicationStatus.FAILED,
    error: CommunicationStatus.FAILED,
    unsubscribed: null,
  };

  private static readonly STATUS_PRECEDENCE: Record<
    CommunicationStatus,
    number
  > = {
    [CommunicationStatus.PENDING]: 0,
    [CommunicationStatus.REQUESTED]: 1,
    [CommunicationStatus.SENT]: 2,
    [CommunicationStatus.DELIVERED]: 3,
    [CommunicationStatus.OPENED]: 4,
    [CommunicationStatus.CLICKED]: 5,
    [CommunicationStatus.FAILED]: 6,
    [CommunicationStatus.BOUNCED]: 6,
    [CommunicationStatus.SPAM]: 6,
    [CommunicationStatus.BLOCKED]: 6,
  };

  /**
   * Processes an incoming Brevo transactional webhook event.
   * Matches the event to an existing CommunicationLog via the Brevo messageId
   * stored in metadata, updates the log status, and appends the event to an
   * audit trail array in metadata.deliveryEvents.
   */
  async handleBrevoWebhook(payload: BrevoWebhookEventDto): Promise<void> {
    const messageId = payload['message-id'];
    if (!messageId) {
      this.logger.warn('Brevo webhook received without message-id. Skipping.');
      return;
    }

    // Find the communication log that matches this Brevo messageId
    const logDoc = await this.logModel
      .findOne({
        'metadata.brevoMessageId': messageId,
        isDeleted: null,
      })
      .exec();

    if (!logDoc) {
      this.logger.warn(
        `Brevo webhook: No matching CommunicationLog found for message-id "${messageId}". Event: ${payload.event}`,
      );
      return;
    }

    // Build the audit event entry
    const deliveryEvent = {
      event: payload.event,
      timestamp: payload.ts_event
        ? new Date(payload.ts_event * 1000).toISOString()
        : new Date().toISOString(),
      date: payload.date,
      reason: payload.reason || null,
      link: payload.link || null,
      userAgent: payload.user_agent || null,
      deviceUsed: payload.device_used || null,
      sendingIp: payload.sending_ip || null,
      ip: payload.sending_ip || null,
      receivedAt: new Date().toISOString(),
    };

    // Append to the deliveryEvents and webhookHistory audit trails
    const existingEvents = logDoc.metadata?.deliveryEvents || [];
    existingEvents.push(deliveryEvent);

    const existingWebhookHistory = logDoc.metadata?.webhookHistory || [];
    existingWebhookHistory.push(deliveryEvent);

    // Determine if we should update the log status
    const mappedStatus = CommunicationsService.BREVO_STATUS_MAP[payload.event];

    if (mappedStatus) {
      const currentPrecedence =
        CommunicationsService.STATUS_PRECEDENCE[logDoc.status] || 0;
      const newPrecedence =
        CommunicationsService.STATUS_PRECEDENCE[mappedStatus] || 0;

      // Only update log status if the new status has equal or higher precedence
      // This prevents out-of-order events from downgrading status (e.g. request arriving after delivered)
      if (newPrecedence >= currentPrecedence) {
        logDoc.status = mappedStatus;

        // For failure events, store the reason as error
        if (
          [
            CommunicationStatus.FAILED,
            CommunicationStatus.BOUNCED,
            CommunicationStatus.SPAM,
            CommunicationStatus.BLOCKED,
          ].includes(mappedStatus)
        ) {
          logDoc.error = payload.reason || `Brevo event: ${payload.event}`;
        }
      }
    }

    // Only update lastBrevoEvent if the incoming event is chronologically newer
    const incomingTimestamp = deliveryEvent.timestamp;
    const existingTimestamp = logDoc.metadata?.lastBrevoEventAt;
    const isNewerEvent =
      !existingTimestamp ||
      new Date(incomingTimestamp) >= new Date(existingTimestamp);

    // Track the latest Brevo event name + update the deliveryEvents & webhookHistory arrays
    logDoc.metadata = {
      ...logDoc.metadata,
      deliveryEvents: existingEvents,
      webhookHistory: existingWebhookHistory,
      ...(isNewerEvent
        ? {
            lastBrevoEvent: payload.event,
            lastBrevoEventAt: incomingTimestamp,
          }
        : {}),
    };

    await logDoc.save();

    this.logger.log(
      `Brevo webhook processed: event="${payload.event}" logId="${logDoc._id}" status="${logDoc.status}"`,
    );
  }

  /**
   * Registers a webhook programmatically via Brevo API
   * and saves the webhook ID to the Brevo provider's configuration.
   */
  async registerBrevoWebhook(url: string): Promise<any> {
    const brevoProvider = await this.providerModel
      .findOne({ name: 'brevo', isDeleted: null })
      .exec();
    if (!brevoProvider) {
      throw new BadRequestException(
        'Brevo provider configuration not found in database. Please configure it first.',
      );
    }

    const apiKey =
      brevoProvider.credentials?.apiKey || process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new BadRequestException(
        'Brevo API key is not configured. Please set the API key under credentials.',
      );
    }

    // 1. If there's an existing webhook ID, clean it up first
    const existingWebhookId = brevoProvider.config?.brevoWebhookId;
    if (existingWebhookId) {
      try {
        this.logger.log(
          `Cleaning up existing Brevo webhook (ID: ${existingWebhookId}) before registering new one.`,
        );
        await fetch(`https://api.brevo.com/v3/webhooks/${existingWebhookId}`, {
          method: 'DELETE',
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        this.logger.warn(
          `Failed to clean up existing Brevo webhook ${existingWebhookId}: ${err.message}`,
        );
      }
    }

    // 2. Call Brevo API to create the new webhook
    this.logger.log(`Registering Brevo webhook for URL: ${url}`);
    const response = await fetch('https://api.brevo.com/v3/webhooks', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Core Media email delivery tracking webhook',
        url,
        events: [
          'sent',
          'request',
          'delivered',
          'hardBounce',
          'softBounce',
          'blocked',
          'spam',
          'invalid',
          'deferred',
          'click',
          'opened',
          'unsubscribed',
        ],
        type: 'transactional',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      this.logger.error(
        `Brevo Webhook Registration failed: ${JSON.stringify(data)}`,
      );
      throw new BadRequestException(
        data?.message || 'Failed to register webhook with Brevo.',
      );
    }

    const webhookId = data.id;

    // 3. Update the provider's config with the webhook ID and URL
    const updatedConfig = {
      ...(brevoProvider.config || {}),
      brevoWebhookId: webhookId,
      brevoWebhookUrl: url,
    };

    brevoProvider.config = updatedConfig;
    brevoProvider.markModified('config');
    await brevoProvider.save();

    await this.providerRegistry.reloadProviders();

    this.logger.log(`Brevo webhook registered successfully. ID: ${webhookId}`);
    return { success: true, webhookId, url };
  }

  /**
   * Unregisters/deletes a webhook programmatically via Brevo API
   * and removes its info from the Brevo provider's configuration.
   */
  async unregisterBrevoWebhook(): Promise<any> {
    const brevoProvider = await this.providerModel
      .findOne({ name: 'brevo', isDeleted: null })
      .exec();
    if (!brevoProvider) {
      throw new BadRequestException(
        'Brevo provider configuration not found in database.',
      );
    }

    const apiKey =
      brevoProvider.credentials?.apiKey || process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('Brevo API key is not configured.');
    }

    const webhookId = brevoProvider.config?.brevoWebhookId;
    if (!webhookId) {
      throw new BadRequestException(
        'No Brevo webhook is currently registered in configuration.',
      );
    }

    // Call Brevo API to delete the webhook
    this.logger.log(`Deleting Brevo webhook ID: ${webhookId}`);
    const response = await fetch(
      `https://api.brevo.com/v3/webhooks/${webhookId}`,
      {
        method: 'DELETE',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
      },
    );

    // Accept 204 or 404 (already deleted)
    if (!response.ok && response.status !== 404) {
      const data = await response.json().catch(() => ({}));
      this.logger.error(
        `Brevo Webhook Deletion failed: ${JSON.stringify(data)}`,
      );
      throw new BadRequestException(
        data?.message || 'Failed to delete webhook from Brevo.',
      );
    }

    // Remove from database provider config
    const updatedConfig = { ...(brevoProvider.config || {}) };
    delete updatedConfig.brevoWebhookId;
    delete updatedConfig.brevoWebhookUrl;

    brevoProvider.config = updatedConfig;
    brevoProvider.markModified('config');
    await brevoProvider.save();

    await this.providerRegistry.reloadProviders();

    this.logger.log(`Brevo webhook ID ${webhookId} unregistered successfully.`);
    return { success: true };
  }

  /**
   * Retrieves all senders registered on the Brevo account.
   */
  async getBrevoSenders(): Promise<any> {
    const brevoProvider = this.providerRegistry.getProvider('brevo') as any;
    if (!brevoProvider) {
      throw new BadRequestException(
        'Brevo provider is not enabled or registered.',
      );
    }
    const client = brevoProvider.getClient();
    if (!client) {
      throw new BadRequestException('Brevo client is not initialized.');
    }
    try {
      const response = await client.senders.getSenders();
      return response;
    } catch (err: any) {
      this.logger.error(`Failed to fetch Brevo senders: ${err.message}`);
      throw new BadRequestException(
        err.message || 'Failed to fetch Brevo senders.',
      );
    }
  }

  /**
   * Registers a new sender with the Brevo API.
   */
  async createBrevoSender(dto: CreateBrevoSenderDto): Promise<any> {
    const brevoProvider = this.providerRegistry.getProvider('brevo') as any;
    if (!brevoProvider) {
      throw new BadRequestException(
        'Brevo provider is not enabled or registered.',
      );
    }
    const client = brevoProvider.getClient();
    if (!client) {
      throw new BadRequestException('Brevo client is not initialized.');
    }
    try {
      const response = await client.senders.createSender({
        email: dto.email,
        name: dto.name,
      });
      return response;
    } catch (err: any) {
      this.logger.error(`Failed to create Brevo sender: ${err.message}`);
      throw new BadRequestException(
        err.message || 'Failed to create Brevo sender.',
      );
    }
  }

  /**
   * Deletes a sender from the Brevo account by its ID.
   */
  async deleteBrevoSender(id: number): Promise<any> {
    const brevoProvider = this.providerRegistry.getProvider('brevo') as any;
    if (!brevoProvider) {
      throw new BadRequestException(
        'Brevo provider is not enabled or registered.',
      );
    }
    const client = brevoProvider.getClient();
    if (!client) {
      throw new BadRequestException('Brevo client is not initialized.');
    }
    try {
      await client.senders.deleteSender({ senderId: id });
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to delete Brevo sender: ${err.message}`);
      throw new BadRequestException(
        err.message || 'Failed to delete Brevo sender.',
      );
    }
  }

  // 6. Event-Template Mappings CRUD
  async findAllEventMappings(): Promise<EventTemplateMapping[]> {
    return this.eventMappingModel
      .find({ isDeleted: null })
      .populate('templateId')
      .populate('triggers.templateId')
      .exec();
  }

  async createEventMapping(
    dto: CreateEventTemplateMappingDto,
  ): Promise<EventTemplateMapping> {
    const existing = await this.eventMappingModel
      .findOne({ event: dto.event, isDeleted: null })
      .exec();
    if (existing) {
      throw new BadRequestException(
        `Event mapping for event "${dto.event}" already exists.`,
      );
    }

    // Validate legacy templateId if provided
    if (dto.templateId) {
      const template = await this.templateModel.findById(dto.templateId).exec();
      if (!template) {
        throw new NotFoundException(
          `Template ID "${dto.templateId}" not found.`,
        );
      }
    }

    // Validate new triggers templates if provided
    if (dto.triggers && dto.triggers.length > 0) {
      for (const trigger of dto.triggers) {
        const template = await this.templateModel
          .findById(trigger.templateId)
          .exec();
        if (!template) {
          throw new NotFoundException(
            `Template ID "${trigger.templateId}" in triggers not found.`,
          );
        }
      }
    }

    const mapping = new this.eventMappingModel(dto);
    return mapping.save();
  }

  async updateEventMapping(
    id: string,
    dto: UpdateEventTemplateMappingDto,
  ): Promise<EventTemplateMapping> {
    const mapping = await this.eventMappingModel
      .findOne({ _id: id, isDeleted: null })
      .exec();
    if (!mapping) {
      throw new NotFoundException(`Event mapping with ID "${id}" not found.`);
    }

    const newEvent = dto.event || mapping.event;

    if (newEvent !== mapping.event) {
      const existing = await this.eventMappingModel
        .findOne({ event: newEvent, isDeleted: null })
        .exec();
      if (existing) {
        throw new BadRequestException(
          `Event mapping for event "${newEvent}" already exists.`,
        );
      }
    }

    // Validate legacy templateId if updating it
    if (dto.templateId) {
      const template = await this.templateModel.findById(dto.templateId).exec();
      if (!template) {
        throw new NotFoundException(
          `Template ID "${dto.templateId}" not found.`,
        );
      }
    }

    // Validate new triggers templates if updating them
    if (dto.triggers && dto.triggers.length > 0) {
      for (const trigger of dto.triggers) {
        const template = await this.templateModel
          .findById(trigger.templateId)
          .exec();
        if (!template) {
          throw new NotFoundException(
            `Template ID "${trigger.templateId}" in triggers not found.`,
          );
        }
      }
    }

    Object.assign(mapping, dto);
    // Explicitly set triggers if provided in the DTO to ensure mongoose marks it as modified/saved
    if (dto.triggers) {
      mapping.triggers = dto.triggers as any;
      mapping.markModified('triggers');
    }
    return mapping.save();
  }

  async deleteEventMapping(id: string): Promise<any> {
    const mapping = await this.eventMappingModel
      .findOne({ _id: id, isDeleted: null })
      .exec();
    if (!mapping) {
      throw new NotFoundException(`Event mapping with ID "${id}" not found.`);
    }
    mapping.isDeleted = new Date();
    await mapping.save();
    return { success: true };
  }

  async findEventMappingByEvent(
    event: string,
  ): Promise<EventTemplateMapping | null> {
    return this.eventMappingModel
      .findOne({ event, isActive: true, isDeleted: null })
      .populate('templateId')
      .populate('triggers.templateId')
      .exec();
  }

  async findEventMappingsByEvent(
    event: string,
  ): Promise<EventTemplateMapping[]> {
    return this.eventMappingModel
      .find({ event, isActive: true, isDeleted: null })
      .populate('templateId')
      .populate('triggers.templateId')
      .exec();
  }

  async syncLogStatusWithProvider(id: string): Promise<CommunicationLog> {
    const logDoc = await this.logModel
      .findOne({ _id: id, isDeleted: null })
      .exec();
    if (!logDoc) {
      throw new NotFoundException(`Communication log with ID ${id} not found`);
    }

    if (logDoc.channel !== CommunicationChannel.EMAIL) {
      throw new BadRequestException(
        'Status synchronization is only supported for Email communications.',
      );
    }

    const messageId = logDoc.metadata?.brevoMessageId;
    if (!messageId) {
      throw new BadRequestException(
        'This log does not have a Brevo Message ID associated with it.',
      );
    }

    const brevoProvider = this.providerRegistry.getProvider(
      'brevo',
    ) as BrevoEmailProvider;
    if (!brevoProvider) {
      throw new BadRequestException('Brevo provider is not registered.');
    }

    const brevoClient = brevoProvider.getClient();
    if (!brevoClient) {
      throw new BadRequestException(
        'Brevo client is not initialized. Check API configuration.',
      );
    }

    try {
      this.logger.debug(
        `Fetching latest update from Brevo for message ID: ${messageId}`,
      );
      const response =
        await brevoClient.transactionalEmails.getEmailEventReport({
          messageId,
        });

      if (!response.events || response.events.length === 0) {
        return logDoc;
      }

      const fetchedEvents = response.events.map((ev) => ({
        event: ev.event,
        timestamp: ev.date,
        date: ev.date,
        reason: ev.reason || null,
        link: ev.link || null,
        userAgent: null,
        deviceUsed: null,
        sendingIp: ev.ip || null,
        ip: ev.ip || null,
        receivedAt: new Date().toISOString(),
      }));

      const apiStatusMap: Record<string, CommunicationStatus | null> = {
        requests: CommunicationStatus.REQUESTED,
        deferred: CommunicationStatus.PENDING,
        delivered: CommunicationStatus.DELIVERED,
        opened: CommunicationStatus.OPENED,
        clicks: CommunicationStatus.CLICKED,
        bounces: CommunicationStatus.BOUNCED,
        hardBounces: CommunicationStatus.BOUNCED,
        softBounces: CommunicationStatus.BOUNCED,
        blocked: CommunicationStatus.BLOCKED,
        spam: CommunicationStatus.SPAM,
        invalid: CommunicationStatus.FAILED,
        error: CommunicationStatus.FAILED,
      };

      let highestStatus = logDoc.status;
      let highestPrecedence =
        CommunicationsService.STATUS_PRECEDENCE[logDoc.status] || 0;
      let errorReason: string | null = logDoc.error || null;
      let latestEvent = logDoc.metadata?.lastBrevoEvent || null;
      let latestEventAt = logDoc.metadata?.lastBrevoEventAt || null;

      for (const ev of response.events) {
        const mapped = apiStatusMap[ev.event];
        if (mapped) {
          const prec = CommunicationsService.STATUS_PRECEDENCE[mapped] || 0;
          if (prec >= highestPrecedence) {
            highestStatus = mapped;
            highestPrecedence = prec;
            if (
              [
                CommunicationStatus.FAILED,
                CommunicationStatus.BOUNCED,
                CommunicationStatus.SPAM,
                CommunicationStatus.BLOCKED,
              ].includes(mapped)
            ) {
              errorReason = ev.reason || `Brevo API event: ${ev.event}`;
            }
          }
        }

        if (!latestEventAt || new Date(ev.date) >= new Date(latestEventAt)) {
          latestEvent = ev.event;
          latestEventAt = ev.date;
        }
      }

      logDoc.status = highestStatus;
      logDoc.error = errorReason;
      logDoc.metadata = {
        ...logDoc.metadata,
        deliveryEvents: fetchedEvents,
        webhookHistory: fetchedEvents,
        ...(latestEvent
          ? { lastBrevoEvent: latestEvent, lastBrevoEventAt: latestEventAt }
          : {}),
      };

      await logDoc.save();
      this.logger.log(
        `Manual sync completed for log ${id}. Mapped status: ${highestStatus}`,
      );
      return logDoc;
    } catch (error) {
      this.logger.error(
        `Failed to sync log status from Brevo: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to sync log status from Brevo: ${error.message}`,
      );
    }
  }
}

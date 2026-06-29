import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
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
} from './dto/communication-provider.dto';
import { SendTemplateMessageDto } from './dto/message-template.dto';
import { BrevoWebhookEventDto } from './dto/brevo-webhook.dto';
import { ProviderRegistryService } from './providers/provider-registry.service';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';

@Injectable()
export class CommunicationsService {
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
  ) {}

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
  ): Promise<CommunicationLog> {
    const log = new this.logModel({
      channel,
      recipient,
      title,
      content,
      status: CommunicationStatus.PENDING,
      metadata: metadata || {},
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
        metadata: metadata || {},
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

  /**
   * Helper to dispatch template-based messages.
   * Resolves active provider, formats the subject, records log, and adds to queue.
   */
  async dispatchTemplateMessage(dto: SendTemplateMessageDto): Promise<CommunicationLog> {
    const template = await this.templateModel.findOne({ slug: dto.slug, isDeleted: null }).exec();
    if (!template) {
      throw new NotFoundException(`Template with slug "${dto.slug}" not found.`);
    }

    const provider = await this.providerRegistry.resolveActiveProvider(template.channel);
    if (!provider) {
      throw new Error(`No active / enabled provider plugin found for channel ${template.channel}. Ensure feature flags are enabled.`);
    }

    // Format subject with template params
    let subject = template.subject || '';
    for (const [key, val] of Object.entries(dto.params)) {
      subject = subject.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(val));
      subject = subject.replace(new RegExp(`{{\\s*params.${key}\\s*}}`, 'g'), String(val));
    }

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
      },
    });
    const savedLog = await log.save();

    const externalTemplateId = template.providerSync?.[provider.name]?.templateId;

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
  async sendEmail(to: string, subject: string, body: string, metadata?: Record<string, any>) {
    return this.dispatch(CommunicationChannel.EMAIL, to, subject, body, metadata);
  }

  async sendSms(to: string, message: string, metadata?: Record<string, any>) {
    return this.dispatch(CommunicationChannel.SMS, to, '', message, metadata);
  }

  async sendPush(token: string, title: string, body: string, metadata?: Record<string, any>) {
    return this.dispatch(CommunicationChannel.PUSH, token, title, body, metadata);
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
  async createProvider(dto: CreateCommunicationProviderDto): Promise<CommunicationProvider> {
    const provider = new this.providerModel(dto);
    const saved = await provider.save();
    await this.providerRegistry.reloadProviders();
    return saved;
  }

  async updateProvider(id: string, dto: UpdateCommunicationProviderDto): Promise<CommunicationProvider> {
    const provider = await this.providerModel
      .findOneAndUpdate({ _id: id, isDeleted: null }, dto, { new: true })
      .exec();

    if (!provider) {
      throw new NotFoundException(`Communication provider with ID ${id} not found`);
    }

    await this.providerRegistry.reloadProviders();
    return provider;
  }

  async removeProvider(id: string): Promise<void> {
    const result = await this.providerModel
      .updateOne({ _id: id }, { isDeleted: new Date() })
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException(`Communication provider with ID ${id} not found`);
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
      throw new NotFoundException(`Webhook subscription with ID ${id} not found`);
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
      throw new NotFoundException(`Webhook subscription with ID ${id} not found`);
    }
    return sub;
  }

  async removeWebhookSubscription(id: string): Promise<void> {
    const result = await this.webhookSubscriptionModel
      .updateOne({ _id: id }, { isDeleted: new Date() })
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException(`Webhook subscription with ID ${id} not found`);
    }
  }

  // ─── Brevo Webhook Event Handler ────────────────────────────────────

  /**
   * Brevo event → CommunicationLog status mapping:
   *   - delivered            → 'sent'  (confirms actual inbox delivery)
   *   - hard_bounce, soft_bounce, blocked, error, invalid_email, spam → 'failed'
   *   - request, deferred, opened, click, unsubscribed → informational only (logged in metadata)
   */
  private static readonly BREVO_STATUS_MAP: Record<string, CommunicationStatus | null> = {
    delivered: CommunicationStatus.SENT,
    hard_bounce: CommunicationStatus.FAILED,
    soft_bounce: CommunicationStatus.FAILED,
    blocked: CommunicationStatus.FAILED,
    error: CommunicationStatus.FAILED,
    invalid_email: CommunicationStatus.FAILED,
    spam: CommunicationStatus.FAILED,
    // Informational-only events — don't override status
    request: null,
    deferred: null,
    opened: null,
    click: null,
    unsubscribed: null,
    unique_opened: null,
    proxy_open: null,
    unique_proxy_open: null,
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
    const logDoc = await this.logModel.findOne({
      'metadata.brevoMessageId': messageId,
      isDeleted: null,
    }).exec();

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
      receivedAt: new Date().toISOString(),
    };

    // Append to the deliveryEvents audit trail
    const existingEvents = logDoc.metadata?.deliveryEvents || [];
    existingEvents.push(deliveryEvent);

    // Determine if we should update the log status
    const mappedStatus = CommunicationsService.BREVO_STATUS_MAP[payload.event];

    // Only update status if the event maps to a concrete status change
    // and we don't downgrade from 'sent' to 'sent' (no-op) or override
    // 'failed' with an informational event.
    if (mappedStatus) {
      logDoc.status = mappedStatus;

      // For failure events, store the reason as error
      if (mappedStatus === CommunicationStatus.FAILED) {
        logDoc.error = payload.reason || `Brevo event: ${payload.event}`;
      }
    }

    // Track the latest Brevo event name + update the deliveryEvents array
    logDoc.metadata = {
      ...logDoc.metadata,
      deliveryEvents: existingEvents,
      lastBrevoEvent: payload.event,
      lastBrevoEventAt: deliveryEvent.timestamp,
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
    const brevoProvider = await this.providerModel.findOne({ name: 'brevo', isDeleted: null }).exec();
    if (!brevoProvider) {
      throw new BadRequestException('Brevo provider configuration not found in database. Please configure it first.');
    }

    const apiKey = brevoProvider.credentials?.apiKey || process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('Brevo API key is not configured. Please set the API key under credentials.');
    }

    // 1. If there's an existing webhook ID, clean it up first
    const existingWebhookId = brevoProvider.config?.brevoWebhookId;
    if (existingWebhookId) {
      try {
        this.logger.log(`Cleaning up existing Brevo webhook (ID: ${existingWebhookId}) before registering new one.`);
        await fetch(`https://api.brevo.com/v3/webhooks/${existingWebhookId}`, {
          method: 'DELETE',
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        this.logger.warn(`Failed to clean up existing Brevo webhook ${existingWebhookId}: ${err.message}`);
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
      this.logger.error(`Brevo Webhook Registration failed: ${JSON.stringify(data)}`);
      throw new BadRequestException(data?.message || 'Failed to register webhook with Brevo.');
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
    const brevoProvider = await this.providerModel.findOne({ name: 'brevo', isDeleted: null }).exec();
    if (!brevoProvider) {
      throw new BadRequestException('Brevo provider configuration not found in database.');
    }

    const apiKey = brevoProvider.credentials?.apiKey || process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('Brevo API key is not configured.');
    }

    const webhookId = brevoProvider.config?.brevoWebhookId;
    if (!webhookId) {
      throw new BadRequestException('No Brevo webhook is currently registered in configuration.');
    }

    // Call Brevo API to delete the webhook
    this.logger.log(`Deleting Brevo webhook ID: ${webhookId}`);
    const response = await fetch(`https://api.brevo.com/v3/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Accept 204 or 404 (already deleted)
    if (!response.ok && response.status !== 404) {
      const data = await response.json().catch(() => ({}));
      this.logger.error(`Brevo Webhook Deletion failed: ${JSON.stringify(data)}`);
      throw new BadRequestException(data?.message || 'Failed to delete webhook from Brevo.');
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

  // 6. Event-Template Mappings CRUD
  async findAllEventMappings(): Promise<EventTemplateMapping[]> {
    return this.eventMappingModel
      .find({ isDeleted: null })
      .populate('templateId')
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
    const template = await this.templateModel.findById(dto.templateId).exec();
    if (!template) {
      throw new NotFoundException(`Template ID "${dto.templateId}" not found.`);
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
    if (dto.event && dto.event !== mapping.event) {
      const existing = await this.eventMappingModel
        .findOne({ event: dto.event, isDeleted: null })
        .exec();
      if (existing) {
        throw new BadRequestException(
          `Event mapping for event "${dto.event}" already exists.`,
        );
      }
    }
    if (dto.templateId) {
      const template = await this.templateModel.findById(dto.templateId).exec();
      if (!template) {
        throw new NotFoundException(`Template ID "${dto.templateId}" not found.`);
      }
    }
    Object.assign(mapping, dto);
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
      .exec();
  }
}

import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Job } from 'bull';
import * as crypto from 'crypto';
import {
  CommunicationLog,
  CommunicationStatus,
  CommunicationChannel,
} from '../schemas/communication-log.schema';
import { ProviderRegistryService } from '../providers/provider-registry.service';

@Processor('communications')
export class CommunicationsProcessor {
  private readonly logger = new Logger(CommunicationsProcessor.name);

  constructor(
    @InjectModel(CommunicationLog.name)
    private readonly logModel: Model<CommunicationLog>,
    @Inject(forwardRef(() => ProviderRegistryService))
    private readonly providerRegistry: ProviderRegistryService,
  ) {}

  @Process('send-email')
  async handleSendEmail(job: Job) {
    const { logId, recipient, title, content } = job.data;
    this.logger.debug(`[Email Job Started] Log ID: ${logId} to ${recipient}`);

    const logDoc = await this.logModel.findById(logId);
    if (!logDoc) {
      this.logger.warn(
        `CommunicationLog ${logId} not found in database. Skipping.`,
      );
      return;
    }

    try {
      const activeProvider = await this.providerRegistry.resolveActiveProvider(
        CommunicationChannel.EMAIL,
      );
      if (activeProvider) {
        const result = await activeProvider.send({
          recipient,
          title,
          content,
          metadata: logDoc.metadata,
          senderEmail: logDoc.metadata?.senderEmail as string | undefined,
          senderName: logDoc.metadata?.senderName as string | undefined,
        });

        if (!result.success) {
          throw new Error(result.error || 'Provider failed to send raw email.');
        }

        logDoc.metadata = {
          ...logDoc.metadata,
          providerName: activeProvider.name,
          brevoMessageId: result.externalId,
        };
      } else {
        // Fallback mock
        this.logger.log(`
          --- MOCK EMAIL ---
          To: ${recipient}
          Subject: ${title}
          Body: ${content}
          ------------------
        `);
        logDoc.metadata = { ...logDoc.metadata, mocked: true };
      }

      logDoc.status = CommunicationStatus.SENT;
      logDoc.error = null;
      logDoc.retryCount = job.attemptsMade;
      await logDoc.save();

      this.logger.debug(
        `[Email Job Completed] Log ID: ${logId} to ${recipient} successfully sent.`,
      );
    } catch (error) {
      this.logger.error(
        `[Email Job Failed] Log ID: ${logId} to ${recipient}. Error: ${error.message}`,
      );

      logDoc.status = CommunicationStatus.FAILED;
      logDoc.error = error.message;
      logDoc.retryCount = job.attemptsMade;
      await logDoc.save();

      throw error;
    }
  }

  @Process('send-template-email')
  async handleSendTemplateEmail(job: Job) {
    const {
      logId,
      recipient,
      recipientName,
      templateSlug,
      externalTemplateId,
      params,
      senderEmail,
      senderName,
    } = job.data;
    this.logger.debug(
      `[Template Email Job Started] Log ID: ${logId} to ${recipient} (Template Slug: ${templateSlug})`,
    );

    const logDoc = await this.logModel.findById(logId);
    if (!logDoc) {
      this.logger.warn(
        `CommunicationLog ${logId} not found in database. Skipping.`,
      );
      return;
    }

    try {
      const activeProvider = await this.providerRegistry.resolveActiveProvider(
        CommunicationChannel.EMAIL,
      );
      if (activeProvider) {
        if (!externalTemplateId) {
          throw new Error(
            `External template ID is missing for provider "${activeProvider.name}". Ensure template synchronization has run.`,
          );
        }

        const result = await activeProvider.sendWithTemplate({
          recipient,
          recipientName,
          templateId: templateSlug,
          externalTemplateId: Number(externalTemplateId),
          params,
          metadata: logDoc.metadata,
          senderEmail,
          senderName,
        });

        if (!result.success) {
          throw new Error(
            result.error || 'Provider failed to send template email.',
          );
        }

        logDoc.metadata = {
          ...logDoc.metadata,
          providerName: activeProvider.name,
          brevoMessageId: result.externalId,
        };
      } else {
        // Fallback mock
        this.logger.log(`
          --- MOCK TEMPLATE EMAIL ---
          To: ${recipient} (Name: ${recipientName})
          Template: ${templateSlug}
          Params: ${JSON.stringify(params)}
          ---------------------------
        `);
        logDoc.metadata = { ...logDoc.metadata, mocked: true };
      }

      logDoc.status = CommunicationStatus.SENT;
      logDoc.error = null;
      logDoc.retryCount = job.attemptsMade;
      await logDoc.save();

      this.logger.debug(
        `[Template Email Job Completed] Log ID: ${logId} to ${recipient} successfully sent.`,
      );
    } catch (error) {
      this.logger.error(
        `[Template Email Job Failed] Log ID: ${logId} to ${recipient}. Error: ${error.message}`,
      );

      logDoc.status = CommunicationStatus.FAILED;
      logDoc.error = error.message;
      logDoc.retryCount = job.attemptsMade;
      await logDoc.save();

      throw error;
    }
  }

  @Process('send-sms')
  async handleSendSms(job: Job) {
    const { logId, recipient, content } = job.data;
    this.logger.debug(`[SMS Job Started] Log ID: ${logId} to ${recipient}`);

    const logDoc = await this.logModel.findById(logId);
    if (!logDoc) return;

    try {
      // Mock SMS delivery log
      this.logger.log(`
        --- MOCK SMS ---
        To: ${recipient}
        Message: ${content}
        ----------------
      `);

      logDoc.status = CommunicationStatus.SENT;
      logDoc.error = null;
      logDoc.retryCount = job.attemptsMade;
      logDoc.metadata = { ...logDoc.metadata, mocked: true };
      await logDoc.save();

      this.logger.debug(`[SMS Job Completed] Log ID: ${logId} to ${recipient}`);
    } catch (error) {
      this.logger.error(
        `[SMS Job Failed] Log ID: ${logId}. Error: ${error.message}`,
      );

      logDoc.status = CommunicationStatus.FAILED;
      logDoc.error = error.message;
      logDoc.retryCount = job.attemptsMade;
      await logDoc.save();

      throw error;
    }
  }

  @Process('send-push')
  async handleSendPush(job: Job) {
    const { logId, recipient, title, content } = job.data;
    this.logger.debug(
      `[Push Job Started] Log ID: ${logId} to token ${recipient}`,
    );

    const logDoc = await this.logModel.findById(logId);
    if (!logDoc) return;

    try {
      // Mock Push notification log
      this.logger.log(`
        --- MOCK PUSH NOTIFICATION ---
        Token: ${recipient}
        Title: ${title}
        Body: ${content}
        ------------------------------
      `);

      logDoc.status = CommunicationStatus.SENT;
      logDoc.error = null;
      logDoc.retryCount = job.attemptsMade;
      logDoc.metadata = { ...logDoc.metadata, mocked: true };
      await logDoc.save();

      this.logger.debug(
        `[Push Job Completed] Log ID: ${logId} to ${recipient}`,
      );
    } catch (error) {
      this.logger.error(
        `[Push Job Failed] Log ID: ${logId}. Error: ${error.message}`,
      );

      logDoc.status = CommunicationStatus.FAILED;
      logDoc.error = error.message;
      logDoc.retryCount = job.attemptsMade;
      await logDoc.save();

      throw error;
    }
  }

  @Process('send-webhook')
  async handleSendWebhook(job: Job) {
    const {
      logId,
      recipient,
      title: eventName,
      content: payloadStr,
      metadata,
    } = job.data;
    this.logger.debug(
      `[Webhook Job Started] Log ID: ${logId} targeting URL: ${recipient}`,
    );

    const logDoc = await this.logModel.findById(logId);
    if (!logDoc) return;

    try {
      const secret = metadata?.secret || '';

      // Calculate HMAC signature
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payloadStr || '')
        .digest('hex');

      // Dispatch real HTTP POST request
      const response = await fetch(recipient, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CoreMedia-Signature': `sha256=${signature}`,
          'X-CoreMedia-Event': eventName,
          'User-Agent': 'CoreMedia-Webhooks/1.0',
        },
        body: payloadStr,
      });

      if (!response.ok) {
        throw new Error(
          `Webhook endpoint responded with status ${response.status}`,
        );
      }

      logDoc.status = CommunicationStatus.SENT;
      logDoc.error = null;
      logDoc.retryCount = job.attemptsMade;
      logDoc.metadata = { ...logDoc.metadata, responseStatus: response.status };
      await logDoc.save();

      this.logger.debug(
        `[Webhook Job Completed] Log ID: ${logId} URL: ${recipient}`,
      );
    } catch (error) {
      this.logger.error(
        `[Webhook Job Failed] Log ID: ${logId} URL: ${recipient}. Error: ${error.message}`,
      );

      logDoc.status = CommunicationStatus.FAILED;
      logDoc.error = error.message;
      logDoc.retryCount = job.attemptsMade;
      await logDoc.save();

      throw error;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';
import {
  ICommunicationProvider,
  SendMessagePayload,
  SendTemplatePayload,
  ProviderSendResult,
  HealthCheckResult,
} from './communication-provider.interface';
import { CommunicationChannel } from '../schemas/communication-log.schema';

@Injectable()
export class BrevoEmailProvider implements ICommunicationProvider {
  readonly name = 'brevo';
  readonly channel = CommunicationChannel.EMAIL;
  private readonly logger = new Logger(BrevoEmailProvider.name);

  private client: BrevoClient | null = null;
  private senderEmail = '';
  private senderName = '';

  initialize(
    credentials: Record<string, any>,
    config: Record<string, any>,
  ): void {
    const apiKey = credentials.apiKey || process.env.BREVO_API_KEY;
    if (!apiKey) {
      this.logger.warn('Brevo API key is not configured.');
      return;
    }

    this.client = new BrevoClient({ apiKey });
    this.senderEmail =
      credentials.senderEmail ||
      config.senderEmail ||
      process.env.BREVO_SENDER_EMAIL ||
      'noreply@coremediagroup.com';
    this.senderName =
      credentials.senderName ||
      config.senderName ||
      process.env.BREVO_SENDER_NAME ||
      'Core Media';
    this.logger.log('Brevo Email Provider initialized successfully.');
  }

  async send(payload: SendMessagePayload): Promise<ProviderSendResult> {
    if (!this.client) {
      return {
        success: false,
        error: 'Brevo client is not initialized.',
      };
    }

    try {
      this.logger.debug(
        `Sending transactional email via Brevo SDK to ${payload.recipient}`,
      );
      const sender = payload.senderEmail
        ? {
            name: payload.senderName || payload.senderEmail.split('@')[0],
            email: payload.senderEmail,
          }
        : { name: this.senderName, email: this.senderEmail };

      const ccList = payload.cc
        ? payload.cc
            .split(',')
            .map((email) => ({ email: email.trim() }))
            .filter((e) => e.email.includes('@'))
        : undefined;
      const bccList = payload.bcc
        ? payload.bcc
            .split(',')
            .map((email) => ({ email: email.trim() }))
            .filter((e) => e.email.includes('@'))
        : undefined;

      const response = await this.client.transactionalEmails.sendTransacEmail({
        sender,
        to: [{ email: payload.recipient }],
        subject: payload.title,
        htmlContent: payload.content,
        ...(ccList && ccList.length > 0 ? { cc: ccList } : {}),
        ...(bccList && bccList.length > 0 ? { bcc: bccList } : {}),
      });

      return {
        success: true,
        externalId: response.messageId,
        rawResponse: response,
      };
    } catch (error) {
      this.logger.error(`Failed to send email via Brevo: ${error.message}`);
      return {
        success: false,
        error: error.message,
        rawResponse: error,
      };
    }
  }

  async sendWithTemplate(
    payload: SendTemplatePayload,
  ): Promise<ProviderSendResult> {
    if (!this.client) {
      return {
        success: false,
        error: 'Brevo client is not initialized.',
      };
    }

    try {
      this.logger.debug(
        `Sending template email via Brevo SDK to ${payload.recipient} using templateId ${payload.externalTemplateId}`,
      );
      const sender = payload.senderEmail
        ? {
            name: payload.senderName || payload.senderEmail.split('@')[0],
            email: payload.senderEmail,
          }
        : { name: this.senderName, email: this.senderEmail };

      const ccList = payload.cc
        ? payload.cc
            .split(',')
            .map((email) => ({ email: email.trim() }))
            .filter((e) => e.email.includes('@'))
        : undefined;
      const bccList = payload.bcc
        ? payload.bcc
            .split(',')
            .map((email) => ({ email: email.trim() }))
            .filter((e) => e.email.includes('@'))
        : undefined;

      const response = await this.client.transactionalEmails.sendTransacEmail({
        sender,
        to: [{ email: payload.recipient, name: payload.recipientName }],
        templateId: payload.externalTemplateId,
        params: payload.params,
        ...(ccList && ccList.length > 0 ? { cc: ccList } : {}),
        ...(bccList && bccList.length > 0 ? { bcc: bccList } : {}),
      });

      return {
        success: true,
        externalId: response.messageId,
        rawResponse: response,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send template email via Brevo: ${error.message}`,
      );
      return {
        success: false,
        error: error.message,
        rawResponse: error,
      };
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    if (!this.client) {
      return {
        isHealthy: false,
        error: 'Brevo client is not initialized. Please configure the API key.',
      };
    }
    try {
      await this.client.account.getAccount();
      return { isHealthy: true };
    } catch (error) {
      this.logger.error(`Brevo health check failed: ${error.message}`);

      // Try to extract the actual Brevo error message from the response body.
      // The error.message format is: "Status code: 401\nBody: { \"message\": \"...\", \"code\": \"...\" }"
      let cleanError = error.message;
      try {
        const bodyMatch = error.message.match(/Body:\s*(\{[\s\S]*\})/);
        if (bodyMatch) {
          const parsed = JSON.parse(bodyMatch[1]);
          if (parsed.message) {
            cleanError = parsed.message;
          }
        }
      } catch {
        // Parsing failed — use the raw error message
      }

      return { isHealthy: false, error: cleanError };
    }
  }

  // Helper method for template syncing (specific to Brevo provider)
  getClient(): BrevoClient | null {
    return this.client;
  }

  getSenderEmail(): string {
    return this.senderEmail;
  }

  getSenderName(): string {
    return this.senderName;
  }
}

import { CommunicationChannel } from '../schemas/communication-log.schema';

export interface SendMessagePayload {
  recipient: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  senderEmail?: string;
  senderName?: string;
  cc?: string;
  bcc?: string;
}

export interface SendTemplatePayload {
  recipient: string;
  recipientName?: string;
  templateId: string; // Internal template slug/ID
  externalTemplateId: number; // Provider-specific template ID
  params: Record<string, any>;
  metadata?: Record<string, any>;
  senderEmail?: string;
  senderName?: string;
  cc?: string;
  bcc?: string;
}

export interface ProviderSendResult {
  success: boolean;
  externalId?: string;
  error?: string;
  rawResponse?: any;
}

export interface HealthCheckResult {
  isHealthy: boolean;
  error?: string;
}

export interface ICommunicationProvider {
  readonly name: string;
  readonly channel: CommunicationChannel;

  initialize(
    credentials: Record<string, any>,
    config: Record<string, any>,
  ): void;
  send(payload: SendMessagePayload): Promise<ProviderSendResult>;
  sendWithTemplate(payload: SendTemplatePayload): Promise<ProviderSendResult>;
  healthCheck(): Promise<HealthCheckResult>;
}

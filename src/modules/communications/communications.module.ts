import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import {
  CommunicationLog,
  CommunicationLogSchema,
} from './schemas/communication-log.schema';
import {
  WebhookSubscription,
  WebhookSubscriptionSchema,
} from './schemas/webhook-subscription.schema';
import {
  CommunicationProvider,
  CommunicationProviderSchema,
} from './schemas/communication-provider.schema';
import {
  MessageTemplate,
  MessageTemplateSchema,
} from './schemas/message-template.schema';
import {
  EventTemplateMapping,
  EventTemplateMappingSchema,
} from './schemas/event-template-mapping.schema';

import { CommunicationsService } from './communications.service';
import { TemplateService } from './services/template.service';
import { ProviderRegistryService } from './providers/provider-registry.service';
import { BrevoEmailProvider } from './providers/brevo-email.provider';
import { CommunicationsProcessor } from './processors/communications.processor';
import { AdminCommunicationsController } from './admin-communications.controller';
import { BrevoWebhookController } from './controllers/brevo-webhook.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CommunicationLog.name, schema: CommunicationLogSchema },
      { name: WebhookSubscription.name, schema: WebhookSubscriptionSchema },
      { name: CommunicationProvider.name, schema: CommunicationProviderSchema },
      { name: MessageTemplate.name, schema: MessageTemplateSchema },
      { name: EventTemplateMapping.name, schema: EventTemplateMappingSchema },
    ]),
    BullModule.registerQueue({
      name: 'communications',
    }),
  ],
  controllers: [AdminCommunicationsController, BrevoWebhookController],
  providers: [
    CommunicationsService,
    TemplateService,
    ProviderRegistryService,
    BrevoEmailProvider,
    CommunicationsProcessor,
  ],
  exports: [CommunicationsService, TemplateService, ProviderRegistryService],
})
export class CommunicationsModule {}

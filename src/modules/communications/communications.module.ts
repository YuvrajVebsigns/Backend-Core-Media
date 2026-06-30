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
import { CommunicationsService } from './communications.service';
import { CommunicationsProcessor } from './processors/communications.processor';
import { AdminCommunicationsController } from './admin-communications.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CommunicationLog.name, schema: CommunicationLogSchema },
      { name: WebhookSubscription.name, schema: WebhookSubscriptionSchema },
    ]),
    BullModule.registerQueue({
      name: 'communications',
    }),
  ],
  controllers: [AdminCommunicationsController],
  providers: [CommunicationsService, CommunicationsProcessor],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}

import { Module } from '@nestjs/common';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { WebsitesModule } from '../websites/websites.module';
import { WebhookModule } from '../../webhook/webhook.module';
import { AuthModule } from '@core/auth/auth.module';

@Module({
  imports: [WebsitesModule, WebhookModule, AuthModule],
  controllers: [DeploymentsController],
  providers: [DeploymentsService],
})
export class DeploymentsModule {}

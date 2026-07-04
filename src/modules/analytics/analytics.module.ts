import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { WebsiteAnalyticsController } from './website-analytics.controller';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AnalyticsEvent, AnalyticsEventSchema } from './schemas/analytics-event.schema';
import { WebsitesModule } from '../websites/websites.module';
import { AuthModule } from '@core/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
    ]),
    WebsitesModule,
    AuthModule,
  ],
  controllers: [WebsiteAnalyticsController, AdminAnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

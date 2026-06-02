import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './event-management.service';
import { AdminEventsController } from './admin-events.controller';
import { WebsiteEventsController } from './website-events.controller';
import { Event, EventSchema } from './schemas/event.schema';
import { Sponsor, SponsorSchema } from '../sponsors/schemas/sponsor.schema';
import { AuthModule } from '@core/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Sponsor.name, schema: SponsorSchema },
    ]),
    AuthModule,
  ],
  controllers: [AdminEventsController, WebsiteEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventManagementModule {}


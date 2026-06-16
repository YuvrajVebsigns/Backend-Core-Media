import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsService } from './event-management.service';
import { AdminEventsController } from './admin-events.controller';
import { WebsiteEventsController } from './website-events.controller';
import { Event, EventSchema } from './schemas/event.schema';
import { Sponsor, SponsorSchema } from '../sponsors/schemas/sponsor.schema';
import { Attendee, AttendeeSchema } from '../attendees/schemas/attendee.schema';
import { EventMeeting, EventMeetingSchema } from './schemas/event-meeting.schema';
import { AuthModule } from '@core/auth/auth.module';
import { FilesModule } from '@core/files/files.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Sponsor.name, schema: SponsorSchema },
      { name: Attendee.name, schema: AttendeeSchema },
      { name: EventMeeting.name, schema: EventMeetingSchema },
    ]),
    AuthModule,
    FilesModule,
  ],
  controllers: [AdminEventsController, WebsiteEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventManagementModule {}


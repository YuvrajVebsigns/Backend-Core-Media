import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventListeners } from './event-listeners';
import { CommunicationsModule } from '../communications/communications.module';
import { SystemUsersModule } from '@core/system-users/system-users.module';
import { AttendeesModule } from '../attendees/attendees.module';
import { EventManagementModule } from '../event-management/event-management.module';
import { BlogsModule } from '../blogs/blogs.module';
import { ContactsModule } from '../contacts/contacts.module';
import { NominationsModule } from '../nominations/nominations.module';
import { WebsitesModule } from '../websites/websites.module';
import { ReportsModule } from '../reports/reports.module';
import { SponsorsModule } from '../sponsors/sponsors.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use wildcard listeners if needed (e.g., 'user.*')
      wildcard: true,
      // Delimiter for wildcard events
      delimiter: '.',
      // Show verbose memory leak warnings after 20 listeners
      maxListeners: 20,
      // Disable throwing on unhandled 'error' events
      verboseMemoryLeak: true,
    }),
    CommunicationsModule,
    SystemUsersModule,
    AttendeesModule,
    EventManagementModule,
    BlogsModule,
    ContactsModule,
    NominationsModule,
    WebsitesModule,
    ReportsModule,
    SponsorsModule,
  ],
  providers: [EventListeners],
  exports: [EventEmitterModule],
})
export class EventsModule {}

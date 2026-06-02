import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendeesService } from './attendees.service';
import { AdminAttendeesController } from './attendees.controller';
import { WebsiteAttendeesController } from './website-attendees.controller';
import { AdminRegistreesController } from './registree.controller';
import { Attendee, AttendeeSchema } from './schemas/attendee.schema';
import { Registree, RegistreeSchema } from './schemas/registree.schema';
import { EventManagementModule } from '@modules/event-management/event-management.module';
import { JobsModule } from '@core/jobs/jobs.module';
import { AuthModule } from '@core/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendee.name, schema: AttendeeSchema },
      { name: Registree.name, schema: RegistreeSchema },
    ]),
    EventManagementModule,
    JobsModule,
    AuthModule,
  ],
  controllers: [
    AdminAttendeesController,
    WebsiteAttendeesController,
    AdminRegistreesController,
  ],
  providers: [AttendeesService],
  exports: [AttendeesService],
})
export class AttendeesModule {}

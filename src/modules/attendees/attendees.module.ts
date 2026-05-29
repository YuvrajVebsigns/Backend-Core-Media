import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendeesService } from './attendees.service';
import { AttendeesController } from './attendees.controller';
import { AdminRegistreesController } from './registree.controller';
import { Attendee, AttendeeSchema } from './schemas/attendee.schema';
import { Registree, RegistreeSchema } from './schemas/registree.schema';
import { EventManagementModule } from '@modules/event-management/event-management.module';
import { JobsModule } from '@core/jobs/jobs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendee.name, schema: AttendeeSchema },
      { name: Registree.name, schema: RegistreeSchema },
    ]),
    EventManagementModule,
    JobsModule,
  ],
  controllers: [AttendeesController, AdminRegistreesController],
  providers: [AttendeesService],
  exports: [AttendeesService],
})
export class AttendeesModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventManagementService } from './event-management.service';
import { EventManagementController } from './event-management.controller';
import { EventManagement, EventManagementSchema } from './schemas/event.schema';
import { Sponsor, SponsorSchema } from '../sponsors/schemas/sponsor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventManagement.name, schema: EventManagementSchema },
      { name: Sponsor.name, schema: SponsorSchema },
    ]),
  ],
  controllers: [EventManagementController],
  providers: [EventManagementService],
  exports: [EventManagementService],
})
export class EventManagementModule {}


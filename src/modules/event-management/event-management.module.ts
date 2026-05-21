import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventManagementService } from './event-management.service';
import { EventManagementController } from './event-management.controller';
import { EventManagement, EventManagementSchema } from './schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventManagement.name, schema: EventManagementSchema },
    ]),
  ],
  controllers: [EventManagementController],
  providers: [EventManagementService],
  exports: [EventManagementService],
})
export class EventManagementModule {}

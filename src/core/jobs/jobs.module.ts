import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { EmailProcessor } from './processors/email.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'emails' },
      { name: 'notifications' },
      { name: 'image-processing' },
    ),
  ],
  controllers: [JobsController],
  providers: [JobsService, EmailProcessor],
  exports: [JobsService],
})
export class JobsModule {}

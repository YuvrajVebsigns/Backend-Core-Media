import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscribesService } from './subscribes.service';
import { AdminSubscribesController } from './admin-subscribes.controller';
import { WebsiteSubscribesController } from './website-subscribes.controller';
import { Subscribe, SubscribeSchema } from './schemas/subscribe.schema';
import { AuthModule } from '@core/auth/auth.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Subscribe.name, schema: SubscribeSchema }]), AuthModule],
  controllers: [AdminSubscribesController, WebsiteSubscribesController],
  providers: [SubscribesService],
  exports: [SubscribesService],
})
export class SubscribesModule {}

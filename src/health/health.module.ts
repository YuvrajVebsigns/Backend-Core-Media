import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';
import { SystemHealthIndicator } from './system.health';
import { StorageHealthIndicator } from './storage.health';
import { FilesModule } from '../modules/files/files.module';

@Module({
  imports: [TerminusModule, FilesModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, SystemHealthIndicator, StorageHealthIndicator],
  exports: [RedisHealthIndicator, SystemHealthIndicator, StorageHealthIndicator, TerminusModule],
})
export class HealthModule {}

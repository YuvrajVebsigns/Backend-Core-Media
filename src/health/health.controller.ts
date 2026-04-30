import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  MongooseHealthIndicator
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';
import { SystemHealthIndicator } from './system.health';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('System')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private mongoose: MongooseHealthIndicator,
    private system: SystemHealthIndicator,
  ) { }

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check API, Database, Redis, and System Metrics' })
  check() {
    return this.health.check([
      // Check if memory heap usage exceeds 512MB
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),

      // Ping MongoDB
      () => this.mongoose.pingCheck('database'),

      // Ping Redis/Cache via Cache Manager
      () => this.redisHealth.isHealthy('cache'),

      // Detailed System & Memory usage
      () => this.system.check('system'),
    ]);
  }
}

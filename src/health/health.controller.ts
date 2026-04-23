import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('System')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check API, Database, and Redis health' })
  check() {
    return this.health.check([
      // Check if memory heap usage exceeds 150MB
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      
      // Ping Redis via Cache Manager
      () => this.redisHealth.isHealthy('redis'),

      // TODO: Uncomment and add DB check once TypeORM or Prisma is configured
      // () => this.db.pingCheck('database')
    ]);
  }
}

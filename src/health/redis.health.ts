import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.cacheManager.set('health_check', 'ok', 1000);
      const val = await this.cacheManager.get('health_check');
      const isHealthy = val === 'ok';
      
      const result = this.getStatus(key, isHealthy);
      
      if (isHealthy) {
        return result;
      }
      throw new HealthCheckError('Redis check failed', result);
    } catch (error: any) {
      const result = this.getStatus(key, false, { message: error.message });
      throw new HealthCheckError('Redis check failed', result);
    }
  }
}

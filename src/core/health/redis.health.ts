import { Injectable, Inject } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check if we are using Redis or in-memory
      const store: any = (this.cacheManager as any).store;

      // cache-manager-redis-yet uses a store object that has a 'client' or 'name' property
      const storeName = store?.name || store?.constructor?.name?.toLowerCase();
      const isRedis = store && (storeName?.includes('redis') || !!store.client);

      // Debug log if needed (can be removed later)
      // console.log('Cache Store Info:', { storeName, isRedis, hasClient: !!store?.client });
      await this.cacheManager.set('health_check', 'ok', 1000);
      const val = await this.cacheManager.get('health_check');
      const isHealthy = val === 'ok';

      if (!isHealthy) {
        throw new Error('Cache verification failed');
      }

      // If it's Redis, check the actual client connection status
      if (isRedis && store.client) {
        // node-redis client has an isOpen/isReady property
        const client = store.client;
        if (client.isOpen === false || client.isReady === false) {
          throw new Error('Redis client is disconnected');
        }
      }

      return this.getStatus(key, true, {
        type: isRedis ? 'redis' : 'in-memory',
        message: isRedis
          ? 'Connected to Redis server'
          : 'Running with in-memory fallback',
      });
    } catch (error: any) {
      const result = this.getStatus(key, false, {
        message: error.message || 'Cache service unavailable',
      });
      throw new HealthCheckError('Cache check failed', result);
    }
  }
}

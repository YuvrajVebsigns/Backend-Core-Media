import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { STORAGE_PROVIDER_TOKEN } from '../modules/files/interfaces/storage-provider.interface';
import type { IStorageProvider } from '../modules/files/interfaces/storage-provider.interface';

@Injectable()
export class StorageHealthIndicator extends HealthIndicator {
  constructor(
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly storageProvider: IStorageProvider,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const isHealthy = await this.storageProvider.checkHealth();
      const result = this.getStatus(key, isHealthy);

      if (isHealthy) {
        return result;
      }
      throw new HealthCheckError('Storage check failed', result);
    } catch (error: any) {
      const result = this.getStatus(key, false, { message: error.message });
      throw new HealthCheckError('Storage check failed', result);
    }
  }
}

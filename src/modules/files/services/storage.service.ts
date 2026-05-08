import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IStorageProvider } from '../interfaces/storage-provider.interface.js';
import {
  STORAGE_PROVIDER_TOKEN,
} from '../interfaces/storage-provider.interface.js';
import type { UploadResult } from '../interfaces/storage-provider.interface.js';
import { FileVisibility } from '../enums/visibility.enum.js';

/**
 * Strategy dispatcher — delegates all storage operations to the
 * active `IStorageProvider` implementation resolved at bootstrap.
 *
 * Business logic never calls a provider directly; it always goes
 * through this service.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly provider: IStorageProvider,
  ) {}

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
    visibility: FileVisibility,
  ): Promise<UploadResult> {
    this.logger.debug(`Uploading file: ${key}`);
    return this.provider.upload(key, buffer, mimeType, visibility);
  }

  async delete(key: string): Promise<void> {
    this.logger.debug(`Deleting file: ${key}`);
    return this.provider.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  async getSignedUrl(key: string, expiresInSeconds?: number): Promise<string> {
    return this.provider.getSignedUrl(key, expiresInSeconds);
  }
}

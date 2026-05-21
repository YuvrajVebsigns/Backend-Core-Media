import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  unlinkSync,
  readFileSync,
} from 'fs';
import { dirname, join } from 'path';
import {
  IStorageProvider,
  UploadResult,
} from '@core/files/interfaces/storage-provider.interface';
import { FileVisibility } from '@core/files/enums/visibility.enum';

/**
 * Local filesystem storage — for development / testing only.
 *
 * Files are written under `UPLOADS_DIR` (defaults to `./uploads`).
 * Signed URLs simply return the local path (no real signing).
 */
@Injectable()
export class LocalStrategy implements IStorageProvider {
  private readonly logger = new Logger(LocalStrategy.name);
  private readonly uploadsDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadsDir = this.configService.get<string>(
      'UPLOADS_DIR',
      './uploads',
    );

    // Ensure the base directory exists
    if (!existsSync(this.uploadsDir)) {
      mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async upload(
    key: string,
    buffer: Buffer,
    _mimeType: string,
    _visibility: FileVisibility,
  ): Promise<UploadResult> {
    const filePath = join(this.uploadsDir, key);
    const dir = dirname(filePath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, buffer);
    this.logger.log(`Saved locally: ${filePath}`);

    return {
      key,
      bucket: 'local',
      size: buffer.length,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.uploadsDir, key);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      this.logger.log(`Deleted locally: ${filePath}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    return existsSync(join(this.uploadsDir, key));
  }

  async getSignedUrl(key: string, _expiresInSeconds = 3600): Promise<string> {
    // In local mode, just return the static path
    const cdnUrl = this.configService.get<string>(
      'CDN_URL',
      'http://localhost:8080/uploads',
    );
    return `${cdnUrl}/${key}`;
  }

  /**
   * Read a file buffer from local storage (used by the worker to re-read originals).
   */
  readFile(key: string): Buffer {
    return readFileSync(join(this.uploadsDir, key));
  }

  async checkHealth(): Promise<boolean> {
    try {
      return existsSync(this.uploadsDir);
    } catch (error) {
      this.logger.error(`Local Storage Health Check Failed: ${error.message}`);
      return false;
    }
  }
}

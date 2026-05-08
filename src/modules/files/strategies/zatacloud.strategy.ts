import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  IStorageProvider,
  UploadResult,
} from '../interfaces/storage-provider.interface.js';
import { FileVisibility } from '../enums/visibility.enum.js';

/**
 * ZataCloud storage strategy — uses S3-compatible SDK.
 *
 * All ZataCloud-specific configuration is injected via `ConfigService`
 * so no hardcoded values leak into business logic.
 */
@Injectable()
export class ZataCloudStrategy implements IStorageProvider {
  private readonly logger = new Logger(ZataCloudStrategy.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('ZATACLOUD_BUCKET', 'core-media');

    this.s3 = new S3Client({
      region: this.configService.get<string>('ZATACLOUD_REGION', 'auto'),
      endpoint: this.configService.get<string>('ZATACLOUD_API_URL'),
      credentials: {
        accessKeyId: this.configService.get<string>('ZATACLOUD_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('ZATACLOUD_SECRET_ACCESS_KEY', ''),
      },
      forcePathStyle: this.configService.get<boolean>('ZATACLOUD_FORCE_PATH_STYLE', true),
    });
  }

  async upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
    visibility: FileVisibility,
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: visibility === FileVisibility.PUBLIC ? 'public-read' : 'private',
    });

    const response = await this.s3.send(command);

    this.logger.log(`Uploaded to ZataCloud: ${key}`);

    return {
      key,
      bucket: this.bucket,
      size: buffer.length,
      etag: response.ETag,
    };
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3.send(command);
    this.logger.log(`Deleted from ZataCloud: ${key}`);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }
}

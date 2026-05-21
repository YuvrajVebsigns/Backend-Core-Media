import { FileVisibility } from '@core/files/enums/visibility.enum';

/**
 * Result returned after a successful upload to the storage provider.
 */
export interface UploadResult {
  /** Full storage key (path) within the bucket */
  key: string;
  /** Bucket / container name */
  bucket: string;
  /** File size in bytes */
  size: number;
  /** Entity tag (content hash) if provided by the storage layer */
  etag?: string;
}

/**
 * Core abstraction for any storage backend.
 *
 * Every provider (ZataCloud, Local, S3, MinIO, Cloudinary …) MUST
 * implement this interface.  The `StorageService` dispatches calls
 * to the active implementation at runtime.
 */
export interface IStorageProvider {
  /**
   * Upload a file buffer to the storage backend.
   *
   * @param key        Full storage path (e.g. `prod/blogs/post/123/original/hero.webp`)
   * @param buffer     Raw file contents
   * @param mimeType   MIME type of the file
   * @param visibility Whether the file should be publicly accessible
   */
  upload(
    key: string,
    buffer: Buffer,
    mimeType: string,
    visibility: FileVisibility,
  ): Promise<UploadResult>;

  /**
   * Permanently remove a file from storage.
   */
  delete(key: string): Promise<void>;

  /**
   * Check whether a file exists in storage.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Generate a time-limited signed URL for private file access.
   *
   * @param key              Storage key
   * @param expiresInSeconds TTL for the signed URL (default: 3600)
   */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Check whether the storage service is healthy and reachable.
   */
  checkHealth(): Promise<boolean>;
}

/**
 * DI token for the active storage provider.
 */
export const STORAGE_PROVIDER_TOKEN = 'STORAGE_PROVIDER';

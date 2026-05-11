/**
 * Supported storage providers.
 * The active provider is resolved at runtime from STORAGE_PROVIDER env var.
 */
export enum StorageProvider {
  S3 = 's3',
  LOCAL = 'local',
  CLOUDINARY = 'cloudinary',
  MINIO = 'minio',
}

/**
 * Supported storage providers.
 * The active provider is resolved at runtime from STORAGE_PROVIDER env var.
 */
export enum StorageProvider {
  ZATACLOUD = 'zatacloud',
  LOCAL = 'local',
  AWS_S3 = 's3',
  CLOUDINARY = 'cloudinary',
  MINIO = 'minio',
}

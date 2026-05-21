import { randomUUID } from 'crypto';
import { ImageVariant } from '@core/files/enums/image-variant.enum';

/**
 * Generates a deterministic, scalable storage key.
 *
 * Format:
 *   {env}/{module}/{entityType}/{entityId}/{variant}/{filename}
 *
 * Examples:
 *   prod/blogs/post/abc123/original/a1b2c3d4.webp
 *   dev/branding/logo/main/thumbnail/e5f6g7h8.webp
 */
export function generateFileKey(params: {
  environment: string;
  module: string;
  entityType: string;
  entityId: string;
  variant: ImageVariant | string;
  filename: string;
}): string {
  const { environment, module, entityType, entityId, variant, filename } =
    params;

  return [environment, module, entityType, entityId, variant, filename]
    .map((segment) => encodeURIComponent(segment.toLowerCase()))
    .join('/');
}

/**
 * Generates a unique filename using UUID v4, preserving the original extension.
 *
 * @param extension File extension without dot (e.g. `webp`, `png`)
 * @returns A filename like `550e8400-e29b-41d4-a716-446655440000.webp`
 */
export function generateUniqueFilename(extension: string): string {
  return `${randomUUID()}.${extension.toLowerCase()}`;
}

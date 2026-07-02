import { BadRequestException } from '@nestjs/common';
import { FileModule } from '@core/files/enums/file-module.enum';

/**
 * Allowed MIME types per file category.
 */
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif',
    'image/bmp',
    'image/tiff',
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/youtube',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
};

/**
 * All MIME types flattened into a single Set for quick lookup.
 */
const ALL_ALLOWED_MIMES = new Set(Object.values(ALLOWED_MIME_TYPES).flat());

/**
 * Per-module file size limits in bytes.
 * Default: 10 MB.
 */
const MODULE_SIZE_LIMITS: Record<string, number> = {
  [FileModule.BLOGS]: 10 * 1024 * 1024, // 10 MB
  [FileModule.BRANDING]: 5 * 1024 * 1024, // 5 MB
  [FileModule.EVENTS]: 10 * 1024 * 1024,
  [FileModule.USERS]: 2 * 1024 * 1024, // 2 MB — avatars
  [FileModule.WEBSITES]: 5 * 1024 * 1024,
  [FileModule.DOCUMENTS]: 25 * 1024 * 1024, // 25 MB
  [FileModule.REPORTS]: 25 * 1024 * 1024, // 25 MB
  [FileModule.TEAMS]: 5 * 1024 * 1024, // 5 MB
  [FileModule.MEDIA]: 50 * 1024 * 1024, // 50 MB
};

const DEFAULT_SIZE_LIMIT = 10 * 1024 * 1024;

/**
 * Validates the uploaded file's MIME type and size.
 *
 * @throws BadRequestException when validation fails
 */
export function validateFile(
  mimeType: string,
  size: number,
  module: FileModule,
  maxSizeOverrideMb?: number,
): void {
  if (!ALL_ALLOWED_MIMES.has(mimeType)) {
    throw new BadRequestException(
      `File type "${mimeType}" is not allowed. Allowed types: ${[...ALL_ALLOWED_MIMES].join(', ')}`,
    );
  }

  const maxSize = maxSizeOverrideMb
    ? maxSizeOverrideMb * 1024 * 1024
    : (MODULE_SIZE_LIMITS[module] ?? DEFAULT_SIZE_LIMIT);

  if (size > maxSize) {
    const limitMb = (maxSize / (1024 * 1024)).toFixed(1);
    throw new BadRequestException(
      `File size (${(size / (1024 * 1024)).toFixed(2)} MB) exceeds the ${limitMb} MB limit for the "${module}" module.`,
    );
  }
}

/**
 * Check whether a given MIME type is an image.
 */
export function isImageMime(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.image.includes(mimeType);
}

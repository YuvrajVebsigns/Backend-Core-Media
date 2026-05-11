import { FileType } from '../enums/file-type.enum.js';
import { extname } from 'path';

/**
 * Maps a MIME type to the broad FileType enum.
 */
export function mimeToFileType(mimeType: string): FileType {
  const major = mimeType.split('/')[0];

  switch (major) {
    case 'image':
      return FileType.IMAGE;
    case 'video':
      return FileType.VIDEO;
    case 'audio':
      return FileType.AUDIO;
    default:
      break;
  }

  // Document-like MIME types
  if (
    mimeType.startsWith('application/pdf') ||
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet') ||
    mimeType.startsWith('text/')
  ) {
    return FileType.DOCUMENT;
  }

  return FileType.OTHER;
}

/**
 * Extracts the file extension from the original filename (without the dot).
 * Falls back to deriving it from the MIME type.
 */
export function extractExtension(
  originalName: string,
  mimeType: string,
): string {
  const ext = extname(originalName).replace(/^\./, '').toLowerCase();
  if (ext) return ext;

  // Fallback: derive from MIME type
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogv',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'weba',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'text/csv': 'csv',
  };

  return mimeToExt[mimeType] ?? 'bin';
}

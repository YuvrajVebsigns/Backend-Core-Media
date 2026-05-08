import { FileType } from '../enums/file-type.enum.js';

/**
 * Normalised representation of a file received through Multer
 * combined with extracted metadata.
 */
export interface UploadedFile {
  /** Original filename from the client */
  originalName: string;
  /** MIME type (e.g. `image/webp`) */
  mimeType: string;
  /** File extension without leading dot (e.g. `webp`) */
  extension: string;
  /** Broad category derived from the MIME type */
  fileType: FileType;
  /** Raw buffer (from memoryStorage) */
  buffer: Buffer;
  /** Size in bytes */
  size: number;
}

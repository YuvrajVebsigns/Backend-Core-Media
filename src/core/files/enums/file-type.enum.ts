/**
 * Broad categorisation of the uploaded file.
 * Determined automatically from the MIME type.
 */
export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  OTHER = 'other',
}

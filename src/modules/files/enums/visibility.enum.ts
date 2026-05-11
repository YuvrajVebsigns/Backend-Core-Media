/**
 * Controls file access level.
 * PUBLIC  → served via CDN, no auth required.
 * PRIVATE → requires a signed URL with expiry.
 */
export enum FileVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

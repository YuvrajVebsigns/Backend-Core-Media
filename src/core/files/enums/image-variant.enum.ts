/**
 * Predefined image variant sizes.
 * Each variant is generated asynchronously by the file-processing worker.
 */
export enum ImageVariant {
  ORIGINAL = 'original',
  THUMBNAIL = 'thumbnail',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

/**
 * Configuration for each variant — max width in px and JPEG/WebP quality (1-100).
 */
export const IMAGE_VARIANT_CONFIG: Record<
  Exclude<ImageVariant, ImageVariant.ORIGINAL>,
  { maxWidth: number; quality: number }
> = {
  [ImageVariant.THUMBNAIL]: { maxWidth: 150, quality: 80 },
  [ImageVariant.SMALL]: { maxWidth: 320, quality: 80 },
  [ImageVariant.MEDIUM]: { maxWidth: 768, quality: 85 },
  [ImageVariant.LARGE]: { maxWidth: 1280, quality: 90 },
};

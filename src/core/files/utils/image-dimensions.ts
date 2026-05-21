import sharp from 'sharp';

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Extracts width and height from an image buffer using sharp.
 * Returns null for non-image or corrupt buffers.
 */
export async function getImageDimensions(
  buffer: Buffer,
): Promise<ImageDimensions | null> {
  try {
    const metadata = await sharp(buffer).metadata();
    if (metadata.width && metadata.height) {
      return { width: metadata.width, height: metadata.height };
    }
    return null;
  } catch {
    return null;
  }
}

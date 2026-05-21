import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

/**
 * Extracts rich metadata from image buffers.
 */
@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  /**
   * Extract width, height, and format from an image buffer.
   */
  async extractImageMetadata(
    buffer: Buffer,
  ): Promise<{ width: number; height: number; format: string } | null> {
    try {
      const metadata = await sharp(buffer).metadata();
      if (metadata.width && metadata.height) {
        return {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format ?? 'unknown',
        };
      }
      return null;
    } catch (error) {
      this.logger.warn('Failed to extract image metadata', error);
      return null;
    }
  }

  /**
   * Generate a lightweight blurhash-like placeholder (base64 tiny preview).
   *
   * For a proper blurhash, a dedicated library like `blurhash` would be used.
   * This implementation generates a tiny 4×4 JPEG as a lightweight placeholder.
   */
  async generatePlaceholder(buffer: Buffer): Promise<string | null> {
    try {
      const tiny = await sharp(buffer)
        .resize(4, 4, { fit: 'inside' })
        .jpeg({ quality: 20 })
        .toBuffer();

      return `data:image/jpeg;base64,${tiny.toString('base64')}`;
    } catch {
      return null;
    }
  }
}

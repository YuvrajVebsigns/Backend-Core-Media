import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface ResizeOptions {
  maxWidth: number;
  quality: number;
  /** Output format — defaults to webp */
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
}

export interface TransformedImage {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: string;
}

/**
 * Image transformation service — resize, convert, and optimise
 * images using the sharp pipeline.
 */
@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  /**
   * Resize and optionally convert an image buffer.
   */
  async resize(
    buffer: Buffer,
    options: ResizeOptions,
  ): Promise<TransformedImage> {
    const format = options.format ?? 'webp';

    let pipeline = sharp(buffer).resize({
      width: options.maxWidth,
      withoutEnlargement: true, // never upscale
      fit: 'inside',
    });

    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality: options.quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: options.quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality: options.quality });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality: options.quality });
        break;
    }

    const outputBuffer = await pipeline.toBuffer();
    const metadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      size: outputBuffer.length,
      format,
    };
  }

  /**
   * Convert any image to WebP at the given quality.
   */
  async toWebp(buffer: Buffer, quality = 85): Promise<Buffer> {
    return sharp(buffer).webp({ quality }).toBuffer();
  }
}

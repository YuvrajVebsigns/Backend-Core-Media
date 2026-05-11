import { Injectable, Logger } from '@nestjs/common';
import { ImageService } from './image.service.js';
import { StorageService } from './storage.service.js';
import {
  ImageVariant,
  IMAGE_VARIANT_CONFIG,
} from '../enums/image-variant.enum.js';
import { FileVisibility } from '../enums/visibility.enum.js';
import { VariantInfo } from '../schemas/file.schema.js';
import {
  generateFileKey,
} from '../utils/generate-file-key.js';

export interface VariantGenerationParams {
  originalBuffer: Buffer;
  environment: string;
  module: string;
  entityType: string;
  entityId: string;
  filename: string;
  visibility: FileVisibility;
}

/**
 * Orchestrates variant generation for an image.
 *
 * For each configured variant (thumbnail, small, medium, large):
 *   1. Resize + convert to WebP via ImageService
 *   2. Upload the variant via StorageService
 *   3. Collect variant metadata
 */
@Injectable()
export class VariantsService {
  private readonly logger = new Logger(VariantsService.name);

  constructor(
    private readonly imageService: ImageService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Generate and upload all image variants.
   *
   * @returns A map of variant name → VariantInfo for schema storage.
   */
  async generateVariants(
    params: VariantGenerationParams,
  ): Promise<Map<string, VariantInfo>> {
    const variants = new Map<string, VariantInfo>();

    const variantEntries = Object.entries(IMAGE_VARIANT_CONFIG) as [
      Exclude<ImageVariant, ImageVariant.ORIGINAL>,
      { maxWidth: number; quality: number },
    ][];

    // Change extension to .webp for all variants
    const baseFilename = params.filename.replace(/\.[^.]+$/, '.webp');

    const results = await Promise.allSettled(
      variantEntries.map(async ([variant, config]) => {
        const transformed = await this.imageService.resize(
          params.originalBuffer,
          {
            maxWidth: config.maxWidth,
            quality: config.quality,
            format: 'webp',
          },
        );

        const variantKey = generateFileKey({
          environment: params.environment,
          module: params.module,
          entityType: params.entityType,
          entityId: params.entityId,
          variant,
          filename: baseFilename,
        });

        await this.storageService.upload(
          variantKey,
          transformed.buffer,
          'image/webp',
          params.visibility,
        );

        return {
          variant,
          info: {
            key: variantKey,
            width: transformed.width,
            height: transformed.height,
            size: transformed.size,
          } as VariantInfo,
        };
      }),
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        variants.set(result.value.variant, result.value.info);
      } else {
        this.logger.error(
          `Failed to generate variant: ${result.reason}`,
        );
      }
    }

    this.logger.log(
      `Generated ${variants.size}/${variantEntries.length} variants`,
    );

    return variants;
  }
}

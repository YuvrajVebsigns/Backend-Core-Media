import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import type { Job } from 'bull';

import { File, FileStatus } from '../schemas/file.schema.js';
import { VariantsService } from '../services/variants.service.js';
import { MetadataService } from '../services/metadata.service.js';
import { StorageService } from '../services/storage.service.js';
import { isImageMime } from '../utils/file-validator.js';

/**
 * BullMQ (bull v4) processor for async file operations.
 *
 * Runs in the background after the upload endpoint returns.
 * Handles:
 *   - Image variant generation (thumbnail, small, medium, large)
 *   - Blurhash / placeholder generation
 *   - Status updates
 */
@Processor('file-processing')
export class FileProcessingWorker {
  private readonly logger = new Logger(FileProcessingWorker.name);
  private readonly environment: string;

  constructor(
    @InjectModel(File.name) private readonly fileModel: Model<File>,
    private readonly variantsService: VariantsService,
    private readonly metadataService: MetadataService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {
    this.environment =
      this.configService.get<string>('NODE_ENV') === 'production'
        ? 'prod'
        : 'dev';
  }

  @Process('process-variants')
  async handleProcessVariants(
    job: Job<{ fileId: string }>,
  ): Promise<void> {
    const { fileId } = job.data;
    this.logger.log(`[Worker] Processing variants for file: ${fileId}`);

    try {
      // 1. Load the file document
      const file = await this.fileModel.findById(fileId).exec();
      if (!file) {
        this.logger.warn(`[Worker] File not found: ${fileId} — skipping`);
        return;
      }

      if (!isImageMime(file.mimeType)) {
        this.logger.debug(
          `[Worker] File ${fileId} is not an image — marking as ready`,
        );
        await this.fileModel.updateOne(
          { _id: fileId },
          { $set: { status: FileStatus.READY } },
        );
        return;
      }

      // 2. Download the original file from storage
      //    For local strategy, we read from disk directly.
      //    For cloud strategies, we use a signed URL + fetch.
      const originalBuffer = await this.downloadOriginal(file);

      if (!originalBuffer) {
        throw new Error(
          `Could not download original file for key: ${file.key}`,
        );
      }

      // 3. Generate blurhash / placeholder
      const blurhash =
        await this.metadataService.generatePlaceholder(originalBuffer);

      // 4. Generate all variants
      const variants = await this.variantsService.generateVariants({
        originalBuffer,
        environment: this.environment,
        module: file.module,
        entityType: file.entityType,
        entityId: file.entityId,
        filename: file.filename,
        visibility: file.visibility,
      });

      // 5. Update the file document
      const variantObj: Record<string, any> = {};
      for (const [key, value] of variants) {
        variantObj[key] = value;
      }

      await this.fileModel.updateOne(
        { _id: fileId },
        {
          $set: {
            variants: variantObj,
            'metadata.blurhash': blurhash,
            status: FileStatus.READY,
          },
        },
      );

      this.logger.log(
        `[Worker] Completed processing for file: ${fileId} — ${variants.size} variants generated`,
      );
    } catch (error) {
      this.logger.error(
        `[Worker] Failed to process file: ${fileId}`,
        error instanceof Error ? error.stack : error,
      );

      // Mark file as failed so it can be retried or investigated
      await this.fileModel.updateOne(
        { _id: fileId },
        { $set: { status: FileStatus.FAILED } },
      );

      throw error; // Re-throw so Bull retries based on job config
    }
  }

  /**
   * Downloads the original file buffer from storage.
   *
   * For local strategy: reads directly from the filesystem.
   * For cloud strategies: fetches via a signed URL.
   */
  private async downloadOriginal(file: File): Promise<Buffer | null> {
    try {
      // Try to get a signed URL and fetch via HTTP
      const signedUrl = await this.storageService.getSignedUrl(file.key, 300);

      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.warn(
        `[Worker] Could not download via signed URL, trying local read: ${error}`,
      );

      // Fallback for local strategy — try reading from the local filesystem
      try {
        const { LocalStrategy } = await import(
          '../strategies/local.strategy.js'
        );
        // Check if the injected provider has a readFile method
        const storageService = this.storageService as any;
        if (
          storageService.provider &&
          storageService.provider instanceof LocalStrategy
        ) {
          return storageService.provider.readFile(file.key);
        }
      } catch {
        // Not a local strategy or file not found
      }

      return null;
    }
  }
}

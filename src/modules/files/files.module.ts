import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Schema
import { File, FileSchema } from './schemas/file.schema.js';

// Controller
import { FilesController } from './controllers/files.controller.js';

// Services
import { FilesService } from './services/files.service.js';
import { StorageService } from './services/storage.service.js';
import { ImageService } from './services/image.service.js';
import { VariantsService } from './services/variants.service.js';
import { MetadataService } from './services/metadata.service.js';
import { UrlService } from './services/url.service.js';

// Worker
import { FileProcessingWorker } from './workers/file-processing.worker.js';

// Strategies
import { ZataCloudStrategy } from './strategies/zatacloud.strategy.js';
import { LocalStrategy } from './strategies/local.strategy.js';

// Interfaces
import { STORAGE_PROVIDER_TOKEN } from './interfaces/storage-provider.interface.js';

// Enums
import { StorageProvider } from './enums/storage-provider.enum.js';

/**
 * Self-contained Files Module.
 *
 * Registers its own:
 *   - Mongoose schema
 *   - Bull queue (`file-processing`)
 *   - Storage provider (resolved from STORAGE_PROVIDER env var)
 *   - All services, strategies, and worker
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    BullModule.registerQueue({ name: 'file-processing' }),
  ],
  controllers: [FilesController],
  providers: [
    // ── Services ────────────────────────────────────────────
    FilesService,
    StorageService,
    ImageService,
    VariantsService,
    MetadataService,
    UrlService,

    // ── Worker ──────────────────────────────────────────────
    FileProcessingWorker,

    // ── Strategies (all registered, but only one is injected) ─
    ZataCloudStrategy,
    LocalStrategy,

    // ── Dynamic provider resolution ─────────────────────────
    {
      provide: STORAGE_PROVIDER_TOKEN,
      useFactory: (
        configService: ConfigService,
        zataCloudStrategy: ZataCloudStrategy,
        localStrategy: LocalStrategy,
      ) => {
        const provider = configService.get<string>(
          'STORAGE_PROVIDER',
          StorageProvider.LOCAL,
        );

        switch (provider) {
          case StorageProvider.ZATACLOUD:
          case StorageProvider.AWS_S3:
            return zataCloudStrategy;
          case StorageProvider.LOCAL:
          default:
            return localStrategy;
        }
      },
      inject: [ConfigService, ZataCloudStrategy, LocalStrategy],
    },
  ],
  exports: [FilesService, UrlService, StorageService],
})
export class FilesModule {}

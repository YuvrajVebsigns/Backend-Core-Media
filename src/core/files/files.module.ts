import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Schema
import { File, FileSchema } from './schemas/file.schema';

// Controller
import { FilesController } from './controllers/files.controller';

// Services
import { FilesService } from './services/files.service';
import { StorageService } from './services/storage.service';
import { ImageService } from './services/image.service';
import { VariantsService } from './services/variants.service';
import { MetadataService } from './services/metadata.service';
import { UrlService } from './services/url.service';

// Worker
import { FileProcessingWorker } from './workers/file-processing.worker';

// Strategies
import { S3Strategy } from './strategies/s3.strategy';
import { LocalStrategy } from './strategies/local.strategy';

// Interfaces
import { STORAGE_PROVIDER_TOKEN } from './interfaces/storage-provider.interface';

// Enums
import { StorageProvider } from './enums/storage-provider.enum';

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
    S3Strategy,
    LocalStrategy,

    // ── Dynamic provider resolution ─────────────────────────
    {
      provide: STORAGE_PROVIDER_TOKEN,
      useFactory: (
        configService: ConfigService,
        s3Strategy: S3Strategy,
        localStrategy: LocalStrategy,
      ) => {
        const provider = configService.get<string>(
          'STORAGE_PROVIDER',
          StorageProvider.LOCAL,
        );

        switch (provider) {
          case StorageProvider.S3:
            return s3Strategy;
          case StorageProvider.LOCAL:
          default:
            return localStrategy;
        }
      },
      inject: [ConfigService, S3Strategy, LocalStrategy],
    },
  ],
  exports: [FilesService, UrlService, StorageService, STORAGE_PROVIDER_TOKEN],
})
export class FilesModule {}

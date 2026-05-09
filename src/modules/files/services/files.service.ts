import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import type { Queue } from 'bull';

import { File, FileStatus } from '../schemas/file.schema.js';
import { StorageService } from './storage.service.js';
import { MetadataService } from './metadata.service.js';
import { UrlService } from './url.service.js';
import { UploadFileDto } from '../dto/upload-file.dto.js';
import { UpdateFileDto } from '../dto/update-file.dto.js';
import { QueryFileDto } from '../dto/query-file.dto.js';
import { FileVisibility } from '../enums/visibility.enum.js';
import { ImageVariant } from '../enums/image-variant.enum.js';
import { StorageProvider } from '../enums/storage-provider.enum.js';
import {
  generateFileKey,
  generateUniqueFilename,
} from '../utils/generate-file-key.js';
import { validateFile, isImageMime } from '../utils/file-validator.js';
import { mimeToFileType, extractExtension } from '../utils/mime-mapper.js';

/**
 * Main orchestrator for file operations.
 *
 * Upload flow:
 *   1. Validate MIME + size
 *   2. Generate UUID filename + storage key
 *   3. Upload original to storage
 *   4. Extract image metadata
 *   5. Save FileDocument to MongoDB (status: processing)
 *   6. Enqueue variant generation job
 *   7. Return the saved document
 */
@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly environment: string;
  private readonly provider: StorageProvider;
  private readonly bucket: string;

  constructor(
    @InjectModel(File.name) private readonly fileModel: Model<File>,
    @InjectQueue('file-processing') private readonly fileQueue: Queue,
    private readonly storageService: StorageService,
    private readonly metadataService: MetadataService,
    private readonly urlService: UrlService,
    private readonly configService: ConfigService,
  ) {
    this.environment =
      this.configService.get<string>('NODE_ENV') === 'production'
        ? 'prod'
        : 'dev';

    this.provider =
      (this.configService.get<string>('STORAGE_PROVIDER') as StorageProvider) ??
      StorageProvider.LOCAL;

    this.bucket = this.configService.get<string>(
      'ZATACLOUD_BUCKET',
      this.provider === StorageProvider.LOCAL ? 'local' : 'core-media',
    );
  }

  // ─── Upload ────────────────────────────────────────────────────────────────

  async upload(
    file: Express.Multer.File | undefined,
    dto: UploadFileDto,
    uploadedBy: string,
  ): Promise<File> {
    let activeFile = file;

    // 1. Handle URL upload if no file buffer is provided
    if (!activeFile && dto.url) {
      try {
        const response = await fetch(dto.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        if (!response.ok) throw new Error(`Failed to fetch from URL: ${response.statusText}`);
        
        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const originalName = dto.url.split('/').pop()?.split('?')[0] || 'external-file';

        activeFile = {
          buffer,
          mimetype: contentType,
          originalname: originalName,
          size: buffer.length,
          fieldname: 'file',
          encoding: '7bit',
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        } as Express.Multer.File;
      } catch (error) {
        this.logger.error(`Error fetching file from URL: ${dto.url}`, error.stack);
        throw new BadRequestException(`Could not download file from the provided URL: ${error.message}`);
      }
    }

    if (!activeFile) {
      throw new BadRequestException('No file buffer or valid URL provided.');
    }

    // 1. Validate
    validateFile(activeFile.mimetype, activeFile.size, dto.module);

    // 2. Derive metadata
    const extension = extractExtension(activeFile.originalname, activeFile.mimetype);
    const fileType = mimeToFileType(activeFile.mimetype);
    const filename = generateUniqueFilename(extension);
    const visibility = dto.visibility ?? FileVisibility.PUBLIC;

    // 3. Generate storage key
    const key = generateFileKey({
      environment: this.environment,
      module: dto.module,
      entityType: dto.entityType,
      entityId: dto.entityId,
      variant: ImageVariant.ORIGINAL,
      filename,
    });

    // 4. Upload to storage provider
    const uploadResult = await this.storageService.upload(
      key,
      activeFile.buffer,
      activeFile.mimetype,
      visibility,
    );

    // 5. Extract image metadata (non-blocking for non-images)
    let metadata: any = { alt: dto.alt ?? '', width: null, height: null, blurhash: null };
    if (isImageMime(activeFile.mimetype)) {
      const imgMeta =
        await this.metadataService.extractImageMetadata(activeFile.buffer);
      if (imgMeta) {
        metadata.width = imgMeta.width;
        metadata.height = imgMeta.height;
      }
    }

    // 6. Determine initial status — images get processed, others are ready immediately
    const status = isImageMime(activeFile.mimetype)
      ? FileStatus.PROCESSING
      : FileStatus.READY;

    // 7. Save to database
    const fileDoc = new this.fileModel({
      provider: this.provider,
      bucket: uploadResult.bucket,
      key: uploadResult.key,
      variants: new Map(),
      module: dto.module,
      entityType: dto.entityType,
      entityId: dto.entityId,
      originalName: activeFile.originalname,
      filename,
      mimeType: activeFile.mimetype,
      extension,
      fileType,
      size: uploadResult.size,
      visibility,
      uploadedBy,
      metadata,
      status,
      keywords: dto.keywords || [],
    });

    const saved = await fileDoc.save();
    this.logger.log(
      `File uploaded: ${saved.id} → ${key} (${fileType}, ${status})`,
    );

    // 8. Queue variant generation for images
    if (isImageMime(activeFile.mimetype)) {
      await this.fileQueue.add(
        'process-variants',
        { fileId: saved.id },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
      this.logger.debug(`Queued variant processing for file ${saved.id}`);
    }

    return this.mapToResponse(saved);
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  async findAll(query: QueryFileDto): Promise<{ files: File[]; meta: any }> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      module, 
      visibility, 
      fileType, 
      sort,
      startDate,
      endDate 
    } = query;
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: null };

    if (search) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(search);
      if (isObjectId) {
        filter.$or = [{ _id: search }];
      } else {
        filter.$or = [
          { originalName: { $regex: search, $options: 'i' } },
          { filename: { $regex: search, $options: 'i' } },
          { 'metadata.alt': { $regex: search, $options: 'i' } },
          { keywords: { $regex: search, $options: 'i' } },
        ];
      }
    }

    if (module) {
      filter.module = module;
    }

    if (visibility) {
      filter.visibility = visibility;
    }

    if (fileType) {
      filter.fileType = fileType;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    let sortOption: any = { createdAt: -1 };
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption = { [field]: order === 'desc' ? -1 : 1 };
    }

    const [filesRaw, total] = await Promise.all([
      this.fileModel
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.fileModel.countDocuments(filter).exec(),
    ]);

    const files = filesRaw.map((f) => this.mapToResponse(f));

    return {
      files,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<File> {
    const file = await this.fileModel.findById(id).exec();
    if (!file) {
      throw new NotFoundException(`File with ID "${id}" not found`);
    }
    return file;
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateFileDto): Promise<File> {
    const updatePayload: any = {};

    if (dto.alt !== undefined) {
      updatePayload['metadata.alt'] = dto.alt;
    }
    if (dto.visibility !== undefined) {
      updatePayload.visibility = dto.visibility;
    }
    if (dto.entityType !== undefined) {
      updatePayload.entityType = dto.entityType;
    }
    if (dto.entityId !== undefined) {
      updatePayload.entityId = dto.entityId;
    }
    if (dto.module !== undefined) {
      updatePayload.module = dto.module;
    }
    if (dto.keywords !== undefined) {
      updatePayload.keywords = dto.keywords;
    }

    const file = await this.fileModel
      .findByIdAndUpdate(id, { $set: updatePayload }, { returnDocument: 'after' })
      .exec();

    if (!file) {
      throw new NotFoundException(`File with ID "${id}" not found`);
    }

    return this.mapToResponse(file);
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async remove(id: string): Promise<void> {
    const file = await this.findById(id);

    // Delete original from storage
    try {
      await this.storageService.delete(file.key);
    } catch (error) {
      this.logger.warn(`Failed to delete original from storage: ${file.key}`, error);
    }

    // Delete all variants from storage
    if (file.variants && file.variants.size > 0) {
      const deletePromises = Array.from(file.variants.values()).map(
        (variant) =>
          this.storageService.delete(variant.key).catch((err) => {
            this.logger.warn(
              `Failed to delete variant from storage: ${variant.key}`,
              err,
            );
          }),
      );
      await Promise.allSettled(deletePromises);
    }

    // Soft-delete the database record
    await this.fileModel
      .updateOne({ _id: id }, { isDeleted: new Date() })
      .exec();

    this.logger.log(`File deleted: ${id}`);
  }

  // ─── URL generation ────────────────────────────────────────────────────────

  // ─── Response Mapping ──────────────────────────────────────────────────────

  /**
   * Transforms a MongoDB File document into a lean Response DTO.
   * Includes full CDN URLs for previews and removes internal storage details.
   */
  public mapToResponse(file: File): any {
    const { url, variants: urlVariants } = this.getUrl(file);

    return {
      id: (file as any)._id || (file as any).id,
      module: file.module,
      entityType: file.entityType,
      entityId: file.entityId,
      originalName: file.originalName,
      mimeType: file.mimeType,
      fileType: file.fileType,
      size: file.size,
      visibility: file.visibility,
      metadata: file.metadata,
      keywords: file.keywords,
      status: file.status,
      url,
      urlVariants,
      variants: file.variants instanceof Map ? Object.fromEntries(file.variants) : file.variants,
      createdAt: (file as any).createdAt,
      updatedAt: (file as any).updatedAt,
    };
  }

  getUrl(file: File): { url: string; variants: Record<string, string> } {
    return {
      url: this.urlService.getPublicUrl(file.key),
      variants: file.variants
        ? this.urlService.getVariantUrls(file.variants)
        : {},
    };
  }

  async getSignedUrl(
    id: string,
    expiresInSeconds = 3600,
  ): Promise<{ signedUrl: string; expiresIn: number }> {
    const file = await this.findById(id);

    if (file.visibility !== FileVisibility.PRIVATE) {
      throw new BadRequestException(
        'Signed URLs are only available for private files. Use GET /files/:id/url for public files.',
      );
    }

    const signedUrl = await this.storageService.getSignedUrl(
      file.key,
      expiresInSeconds,
    );

    return { signedUrl, expiresIn: expiresInSeconds };
  }
}

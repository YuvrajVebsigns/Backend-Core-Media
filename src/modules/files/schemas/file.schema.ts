import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '../../../common/schemas/base.schema.js';
import { StorageProvider } from '../enums/storage-provider.enum.js';
import { FileModule } from '../enums/file-module.enum.js';
import { FileType } from '../enums/file-type.enum.js';
import { FileVisibility } from '../enums/visibility.enum.js';

// ─── Embedded Sub-schemas ────────────────────────────────────────────────────

@Schema({ _id: false })
export class FileMetadata {
  @Prop({ type: Number, default: null })
  width: number | null;

  @Prop({ type: Number, default: null })
  height: number | null;

  @Prop({ type: String, trim: true, default: '' })
  alt: string;

  @Prop({ type: String, default: null })
  blurhash: string | null;
}

@Schema({ _id: false })
export class VariantInfo {
  @Prop({ required: true })
  key: string;

  @Prop({ type: Number, default: null })
  width: number | null;

  @Prop({ type: Number, default: null })
  height: number | null;

  @Prop({ type: Number, default: 0 })
  size: number;
}

// ─── File Status ─────────────────────────────────────────────────────────────

export enum FileStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

// ─── Main Schema ─────────────────────────────────────────────────────────────

@Schema({
  collection: 'files',
  timestamps: true,
})
export class File extends BaseSchema {
  // ── Storage location (never store full URLs!) ───────────────
  @Prop({
    type: String,
    enum: Object.values(StorageProvider),
    required: true,
  })
  provider: StorageProvider;

  @Prop({ required: true, trim: true })
  bucket: string;

  @Prop({ required: true, trim: true })
  key: string;

  // ── Variants map ────────────────────────────────────────────
  @Prop({
    type: MongooseSchema.Types.Map,
    of: {
      key: { type: String, required: true },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
      size: { type: Number, default: 0 },
    },
    default: new Map(),
  })
  variants: Map<string, VariantInfo>;

  // ── Ownership / context ─────────────────────────────────────
  @Prop({
    type: String,
    enum: Object.values(FileModule),
    required: true,
    index: true,
  })
  module: FileModule;

  @Prop({ required: true, trim: true })
  entityType: string;

  @Prop({ required: true, trim: true })
  entityId: string;

  // ── File metadata ───────────────────────────────────────────
  @Prop({ required: true, trim: true })
  originalName: string;

  @Prop({ required: true, trim: true })
  filename: string;

  @Prop({ required: true, trim: true })
  mimeType: string;

  @Prop({ required: true, trim: true })
  extension: string;

  @Prop({
    type: String,
    enum: Object.values(FileType),
    required: true,
  })
  fileType: FileType;

  @Prop({ required: true, min: 0 })
  size: number;

  // ── Access control ──────────────────────────────────────────
  @Prop({
    type: String,
    enum: Object.values(FileVisibility),
    default: FileVisibility.PUBLIC,
  })
  visibility: FileVisibility;

  // ── Who uploaded ────────────────────────────────────────────
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'SystemUser',
    required: true,
  })
  uploadedBy: string;

  // ── Rich metadata (images) ──────────────────────────────────
  @Prop({ type: FileMetadata, default: () => ({}) })
  metadata: FileMetadata;

  // ── Processing status ───────────────────────────────────────
  @Prop({
    type: String,
    enum: Object.values(FileStatus),
    default: FileStatus.PROCESSING,
  })
  status: FileStatus;
}

export const FileSchema = SchemaFactory.createForClass(File);

// Apply soft delete middleware
applySoftDeleteMiddleware(FileSchema);

// JSON transform
FileSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    // Convert Map to plain object for serialisation
    if (ret.variants instanceof Map) {
      ret.variants = Object.fromEntries(ret.variants);
    }
    return ret;
  },
});

// ── Indexes ──────────────────────────────────────────────────────────────────
FileSchema.index({ module: 1, entityType: 1, entityId: 1 });
FileSchema.index({ uploadedBy: 1, createdAt: -1 });
FileSchema.index({ status: 1 });
FileSchema.index({ key: 1 }, { unique: true });

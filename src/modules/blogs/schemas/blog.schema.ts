import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseSchema, applySoftDeleteMiddleware } from '../../../common/schemas/base.schema';
import { Website } from '../../websites/schemas/website.schema';
import { SystemUser } from '../../../system-users/schemas/system-user.schema';
import { BlogStatus } from '../enums/blog-status.enum';
import { AutoArchiveDuration } from '../enums/auto-archive-duration.enum';
import { CommentStrategy } from '../enums/comment-strategy.enum';

@Schema({ _id: false })
export class BlogSeo {
  @Prop({ trim: true })
  metaTitle: string;

  @Prop({ trim: true })
  metaDescription: string;

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ trim: true })
  ogImage: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'File' })
  ogImageId: MongooseSchema.Types.ObjectId;
}

@Schema({
  collection: 'blogs',
  timestamps: true,
})
export class Blog extends BaseSchema {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true, lowercase: true })
  slug: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  content: any;

  @Prop({ trim: true })
  excerpt: string;

  @Prop({ trim: true })
  featureImage: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'File' })
  featureImageId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Website' }],
    default: [],
  })
  websites: Website[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'SystemUser',
    required: true,
  })
  author: SystemUser;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({
    type: String,
    enum: Object.values(BlogStatus),
    default: BlogStatus.DRAFT,
    index: true,
  })
  status: BlogStatus;

  @Prop({ type: Date, default: null })
  scheduledAt: Date | null;

  @Prop({ type: Date, default: null })
  publishedAt: Date | null;

  @Prop({ type: Date, default: null })
  autoArchiveAt: Date | null;

  @Prop({
    type: String,
    enum: Object.values(AutoArchiveDuration),
    default: null,
  })
  autoArchiveDuration: AutoArchiveDuration | null;

  @Prop({
    type: String,
    enum: Object.values(CommentStrategy),
    default: CommentStrategy.PUBLIC,
  })
  commentStrategy: CommentStrategy;

  @Prop({ type: [String], default: [] })
  invitedEmails: string[];

  @Prop({ default: false })
  isHyperlinked: boolean;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Website' }],
    default: [],
  })
  hyperlinkWebsites: Website[];

  @Prop({ type: BlogSeo, default: () => ({}) })
  seo: BlogSeo;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

// Apply soft delete middleware
applySoftDeleteMiddleware(BlogSchema);

BlogSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Indexes
BlogSchema.index({ websites: 1, isActive: 1 });
BlogSchema.index({ slug: 1 }, { unique: true });
BlogSchema.index({ title: 'text', content: 'text' });

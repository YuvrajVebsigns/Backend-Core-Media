import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseSchema, applySoftDeleteMiddleware } from '../../../common/schemas/base.schema';

@Schema({ _id: false })
class SeoMetadata {
  @Prop({ trim: true })
  metaTitle: string;

  @Prop({ trim: true })
  metaDescription: string;

  @Prop({ type: [String], default: [] })
  metaKeywords: string[];

  @Prop({ trim: true })
  ogImage: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'File' })
  ogImageId: MongooseSchema.Types.ObjectId;
}

@Schema({
  collection: 'websites',
  timestamps: true,
})
export class Website extends BaseSchema {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug: string;

  @Prop({ required: true, unique: true, trim: true })
  domain: string;

  @Prop({ trim: true })
  logo: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'File' })
  logoId: MongooseSchema.Types.ObjectId;

  @Prop({ trim: true })
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;

  @Prop({ type: SeoMetadata, default: {} })
  seo: SeoMetadata;
}

export const WebsiteSchema = SchemaFactory.createForClass(Website);

// Apply soft delete middleware
applySoftDeleteMiddleware(WebsiteSchema);

WebsiteSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

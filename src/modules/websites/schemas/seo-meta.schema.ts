import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class SeoMeta {
  @Prop({ trim: true })
  metaTitle?: string;

  @Prop({ trim: true })
  metaDescription?: string;

  @Prop({ type: [String], default: [] })
  metaKeywords?: string[];

  @Prop({ trim: true })
  canonicalUrl?: string;

  @Prop({ trim: true, default: 'index, follow' })
  robots?: string;

  @Prop({ trim: true })
  ogTitle?: string;

  @Prop({ trim: true })
  ogDescription?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'File' })
  ogImageId?: MongooseSchema.Types.ObjectId;

  @Prop({ trim: true })
  twitterTitle?: string;

  @Prop({ trim: true })
  twitterDescription?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'File' })
  twitterImageId?: MongooseSchema.Types.ObjectId;

  @Prop({ trim: true })
  schemaMarkup?: string; // JSON-LD schema payload

  @Prop({ default: false })
  noIndex: boolean;

  @Prop({ default: false })
  noFollow: boolean;
}
export const SeoMetaSchema = SchemaFactory.createForClass(SeoMeta);

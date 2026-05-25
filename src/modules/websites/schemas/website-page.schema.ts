import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseSchema, applySoftDeleteMiddleware } from '@common/schemas/base.schema';
import { PageStatus } from '../enums/page-status.enum';
import { PageType } from '../enums/page-type.enum';
import { SeoMeta, SeoMetaSchema } from './seo-meta.schema';
import { IPageSection } from '../interfaces/page-section.interface';

@Schema({ collection: 'website_pages', timestamps: true })
export class WebsitePage extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Website', required: true, index: true })
  siteId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  slug: string;

  @Prop({ trim: true })
  shortDescription?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  content: any; // Raw JSON from EditorJS

  @Prop({ type: String, enum: Object.values(PageType), default: PageType.STATIC_PAGE })
  pageType: PageType;

  @Prop({ type: String, enum: Object.values(PageStatus), default: PageStatus.DRAFT, index: true })
  status: PageStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'File' })
  featuredImageId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.Mixed }], default: [] })
  sections: IPageSection[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Navbar' })
  navbarId?: MongooseSchema.Types.ObjectId;

  @Prop({ default: false })
  isHomepage: boolean;

  @Prop({ type: Date, default: null })
  publishedAt?: Date;

  @Prop({ type: SeoMetaSchema, default: {} })
  seo: SeoMeta;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SystemUser', required: true })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SystemUser' })
  updatedBy?: MongooseSchema.Types.ObjectId;
}
export const WebsitePageSchema = SchemaFactory.createForClass(WebsitePage);
applySoftDeleteMiddleware(WebsitePageSchema);

WebsitePageSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

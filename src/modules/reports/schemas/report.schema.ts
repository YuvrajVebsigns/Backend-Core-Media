import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

@Schema({
  collection: 'reports',
  timestamps: true,
})
export class Report extends BaseSchema {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true, unique: true, index: true })
  slug: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'File',
    required: true,
  })
  fileId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  downloadCount: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Website',
    required: false,
    index: true,
  })
  websiteId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Boolean, default: true, index: true })
  isPublished: boolean;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// Apply soft delete middleware
applySoftDeleteMiddleware(ReportSchema);

ReportSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

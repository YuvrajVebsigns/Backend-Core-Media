import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Document } from 'mongoose';
import { BaseSchema, applySoftDeleteMiddleware } from '../../../common/schemas/base.schema';

@Schema({
  collection: 'blog_comments',
  timestamps: true,
})
export class BlogComment extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Blog', required: true, index: true })
  blogId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  authorName: string;

  @Prop({ required: true, trim: true, lowercase: true })
  authorEmail: string;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
    index: true,
  })
  status: string;
}

export type BlogCommentDocument = BlogComment & Document;
export const BlogCommentSchema = SchemaFactory.createForClass(BlogComment);

// Apply soft delete middleware
applySoftDeleteMiddleware(BlogCommentSchema);

BlogCommentSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    if (doc.createdAt) ret.createdAt = doc.createdAt;
    if (doc.updatedAt) ret.updatedAt = doc.updatedAt;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

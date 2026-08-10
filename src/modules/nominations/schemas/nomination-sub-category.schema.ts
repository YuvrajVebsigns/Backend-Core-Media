import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

@Schema({
  collection: 'nomination_sub_categories',
  timestamps: true,
})
export class NominationSubCategory extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'NominationCategory', required: true, index: true })
  categoryId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string = '';

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
  })
  slug: string = '';

  @Prop({ default: true })
  isActive: boolean = true;

  @Prop({ type: Number, default: 0 })
  sortOrder: number = 0;
}

export const NominationSubCategorySchema = SchemaFactory.createForClass(
  NominationSubCategory,
);

// Apply soft delete middleware
applySoftDeleteMiddleware(NominationSubCategorySchema);

NominationSubCategorySchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

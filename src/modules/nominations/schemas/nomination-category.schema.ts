import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

@Schema({
  collection: 'nomination_categories',
  timestamps: true,
})
export class NominationCategory extends BaseSchema {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
  })
  slug: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;
}

export const NominationCategorySchema =
  SchemaFactory.createForClass(NominationCategory);

// Apply soft delete middleware
applySoftDeleteMiddleware(NominationCategorySchema);

NominationCategorySchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

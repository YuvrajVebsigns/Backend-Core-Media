import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: {
    getters: true,
    virtuals: true,
    transform: (doc, ret: any) => {
      if (ret._id) ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    getters: true,
    virtuals: true,
    transform: (doc, ret: any) => {
      if (ret._id) ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class BaseSchema extends Document {
  id: string;

  @Prop({ default: null, type: Date })
  isDeleted: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Middleware to handle soft delete filtering automatically
 */
export const applySoftDeleteMiddleware = (schema: any) => {
  schema.pre(/^find/, function () {
    this.where({ isDeleted: null });
  });

  schema.pre('countDocuments', function () {
    this.where({ isDeleted: null });
  });

  schema.pre(/^update/, function () {
    this.where({ isDeleted: null });
  });

  schema.pre('aggregate', function () {
    const pipeline = this.pipeline();
    pipeline.unshift({ $match: { isDeleted: null } });
  });
};

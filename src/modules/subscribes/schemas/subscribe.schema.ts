import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseSchema, applySoftDeleteMiddleware } from '@common/schemas/base.schema';

@Schema({
  collection: 'subscribes',
  timestamps: true,
})
export class Subscribe extends BaseSchema {
  @Prop({ required: true, trim: true })
  email: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Website',
    required: true,
  })
  websiteId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date, default: () => new Date() })
  subscribedAt: Date;

  @Prop({ required: false, trim: true })
  source?: string;

  @Prop({ type: Boolean, default: false })
  isVerified?: boolean;
}

export const SubscribeSchema = SchemaFactory.createForClass(Subscribe);

// Indexes
SubscribeSchema.index({ websiteId: 1 });
SubscribeSchema.index({ email: 1, websiteId: 1 });
SubscribeSchema.index({ createdAt: -1 });

applySoftDeleteMiddleware(SubscribeSchema);

SubscribeSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

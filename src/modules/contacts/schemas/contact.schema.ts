import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

export enum ContactStatus {
  PENDING = 'Pending',
  REPLIED = 'Replied',
}

@Schema({
  collection: 'contacts',
  timestamps: true,
})
export class Contact extends BaseSchema {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  service: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Website',
    required: true,
  })
  websiteId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: ContactStatus,
    default: ContactStatus.PENDING,
    required: true,
  })
  status: ContactStatus;

  @Prop({ trim: true })
  replyMessage?: string;

  @Prop({ type: Date })
  repliedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SystemUser' })
  repliedBy?: MongooseSchema.Types.ObjectId;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);

// Indexes
ContactSchema.index({ websiteId: 1 });
ContactSchema.index({ status: 1 });
ContactSchema.index({ createdAt: -1 });

// Apply soft delete middleware
applySoftDeleteMiddleware(ContactSchema);

ContactSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

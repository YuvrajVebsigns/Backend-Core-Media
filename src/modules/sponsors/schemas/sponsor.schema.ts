import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseSchema, applySoftDeleteMiddleware } from '../../../common/schemas/base.schema';

@Schema({
  collection: 'sponsors',
  timestamps: true,
})
export class Sponsor extends BaseSchema {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  companyName: string;

  @Prop({ trim: true })
  companyDomain: string;

  @Prop({ trim: true })
  valuation: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'File' })
  logoId: MongooseSchema.Types.ObjectId;

  @Prop({ trim: true })
  website: string;

  @Prop({ trim: true })
  type: string; // e.g., Gold, Silver, Platinum

  @Prop({ trim: true })
  description: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const SponsorSchema = SchemaFactory.createForClass(Sponsor);

// Apply soft delete middleware
applySoftDeleteMiddleware(SponsorSchema);

SponsorSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

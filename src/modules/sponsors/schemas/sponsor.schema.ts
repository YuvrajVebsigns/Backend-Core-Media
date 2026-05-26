import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

export enum SponsorType {
  INDIVIDUAL = 'Individual',
  COMPANY = 'Company',
  COMPANY_UNIT = 'CompanyUnit',
}

export enum SponsorTier {
  PLATINUM = 'Platinum',
  GOLD = 'Gold',
  SILVER = 'Silver',
  BRONZE = 'Bronze',
  PARTNER = 'Partner',
}

@Schema({ _id: false })
export class SocialLinks {
  @Prop({ trim: true })
  linkedin?: string;

  @Prop({ trim: true })
  twitter?: string;

  @Prop({ trim: true })
  facebook?: string;

  @Prop({ trim: true })
  instagram?: string;
}

@Schema({ _id: false })
export class Address {
  @Prop({ trim: true })
  street?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true })
  country?: string;

  @Prop({ trim: true })
  zip?: string;
}

@Schema({
  collection: 'sponsors',
  timestamps: true,
})
export class Sponsor extends BaseSchema {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  companyName?: string;

  @Prop({ trim: true })
  companyDomain?: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  designation?: string;

  @Prop({ trim: true })
  logo?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'File' })
  logoId?: MongooseSchema.Types.ObjectId;

  @Prop({ trim: true })
  website?: string;

  @Prop({ trim: true })
  valuation?: string;

  @Prop({ type: String, enum: SponsorType, default: SponsorType.COMPANY })
  type: SponsorType;

  @Prop({ type: String, enum: SponsorTier })
  tier?: SponsorTier;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: SocialLinks, default: {} })
  socialLinks?: SocialLinks;

  @Prop({ type: Address, default: {} })
  address?: Address;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Website' }],
    default: [],
  })
  websites: MongooseSchema.Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;
}

export const SponsorSchema = SchemaFactory.createForClass(Sponsor);

// Indexes
SponsorSchema.index({ name: 1 });
SponsorSchema.index({ type: 1 });
SponsorSchema.index({ tier: 1 });
SponsorSchema.index({ isActive: 1 });
SponsorSchema.index({ websites: 1 });
SponsorSchema.index({ sortOrder: 1 });

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

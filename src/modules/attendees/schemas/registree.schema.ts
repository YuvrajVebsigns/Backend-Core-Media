import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

@Schema({
  collection: 'registrees',
  timestamps: true,
})
export class Registree extends BaseSchema {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true, index: true })
  email: string;

  @Prop({ trim: true, index: true })
  countryCode: string;

  @Prop({ trim: true, index: true })
  phoneNumber: string;

  @Prop({ trim: true })
  organization: string;

  @Prop({ trim: true })
  city: string;

  @Prop({
    type: [String],
    default: ['registree'],
    index: true,
  })
  tags: string[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Website',
    required: false,
  })
  websiteId?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [{
      reportId: { type: MongooseSchema.Types.ObjectId, ref: 'Report' },
      downloadedAt: { type: Date, default: Date.now },
      firstName: String,
      lastName: String,
      companyName: String,
      designation: String,
      industry: String,
      phoneNumber: String,
      countryCode: String,
    }],
    default: [],
  })
  downloadedReports?: Array<{
    reportId: Types.ObjectId;
    downloadedAt: Date;
    firstName: string;
    lastName: string;
    companyName: string;
    designation: string;
    industry: string;
    phoneNumber: string;
    countryCode: string;
  }>;

  @Prop({
    type: [{
      eventId: { type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true },
      name: String,
      email: String,
      countryCode: String,
      phoneNumber: String,
      organization: String,
      status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'BLOCKED'], default: 'PENDING' },
      registeredAt: { type: Date, default: Date.now },
    }],
    default: [],
  })
  registrations?: Array<{
    eventId: Types.ObjectId;
    name: string;
    email: string;
    countryCode?: string;
    phoneNumber?: string;
    organization?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
    registeredAt: Date;
  }>;
}

export const RegistreeSchema = SchemaFactory.createForClass(Registree);

// Apply soft delete middleware
applySoftDeleteMiddleware(RegistreeSchema);

RegistreeSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

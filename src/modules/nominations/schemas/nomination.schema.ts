import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

export enum NominationStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ _id: false })
export class NomineeEntry {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Registree',
    required: true,
  })
  nomineeId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'NominationCategory',
    required: true,
  })
  categoryId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'NominationSubCategory',
    required: false,
  })
  subCategoryId?: Types.ObjectId;

  @Prop({ type: String, required: false })
  contactName?: string;

  @Prop({ type: String, required: false })
  companyName?: string;

  @Prop({ type: String, required: false })
  contactEmail?: string;

  @Prop({ type: String, required: false })
  mobileNo?: string;
}

export const NomineeEntrySchema = SchemaFactory.createForClass(NomineeEntry);

@Schema({ _id: false })
export class NominatorSnapshot {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: false })
  company?: string;

  @Prop({ type: String, required: false })
  city?: string;

  @Prop({ type: String, required: false })
  phone?: string;
}

export const NominatorSnapshotSchema =
  SchemaFactory.createForClass(NominatorSnapshot);

@Schema({
  collection: 'nominations',
  timestamps: true,
})
export class Nomination extends BaseSchema {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Registree',
    required: true,
    index: true,
  })
  nominatorId: Types.ObjectId;

  @Prop({
    type: NominatorSnapshotSchema,
    required: false,
  })
  nominatorSnapshot?: NominatorSnapshot;

  @Prop({
    type: [NomineeEntrySchema],
    default: [],
    validate: {
      validator: (v: NomineeEntry[]) => v.length <= 10,
      message:
        'A single nomination submission can contain up to 10 nominees only.',
    },
  })
  nominees: NomineeEntry[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Website',
    required: false,
  })
  websiteId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(NominationStatus),
    default: NominationStatus.PENDING,
    index: true,
  })
  status: NominationStatus;
}

export const NominationSchema = SchemaFactory.createForClass(Nomination);

// Apply soft delete middleware
applySoftDeleteMiddleware(NominationSchema);

NominationSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Index for fast lookups by nominator
NominationSchema.index({ nominatorId: 1, websiteId: 1 });

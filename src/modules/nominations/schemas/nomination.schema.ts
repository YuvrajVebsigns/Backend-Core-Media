import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
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
  nomineeId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'NominationCategory',
    required: true,
  })
  categoryId: MongooseSchema.Types.ObjectId;
}

export const NomineeEntrySchema = SchemaFactory.createForClass(NomineeEntry);

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
  nominatorId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [NomineeEntrySchema],
    default: [],
    validate: {
      validator: (v: NomineeEntry[]) => v.length <= 10,
      message: 'A nominator can nominate up to 10 nominees only.',
    },
  })
  nominees: NomineeEntry[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Website',
    required: false,
  })
  websiteId?: MongooseSchema.Types.ObjectId;

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

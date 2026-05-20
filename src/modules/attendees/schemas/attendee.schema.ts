import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseSchema, applySoftDeleteMiddleware } from '../../../common/schemas/base.schema';

export enum AttendeeStatus {
  INVITED = 'INVITED',
  REGISTERED = 'REGISTERED',
  CHECKED_IN = 'CHECKED_IN',
  BLOCKED = 'BLOCKED',
  REJECTED = 'REJECTED',
}

@Schema({
  collection: 'attendees',
  timestamps: true,
})
export class Attendee extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'EventManagement', required: true })
  eventId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({
    type: String,
    enum: Object.values(AttendeeStatus),
    default: AttendeeStatus.INVITED,
    index: true,
  })
  status: AttendeeStatus;

  @Prop({ required: true, unique: true, trim: true })
  passCode: string;

  @Prop({ trim: true })
  qrCode: string; // Base64 or URL

  @Prop({ type: Date, default: Date.now })
  registeredAt: Date;

  @Prop({ type: Date })
  checkedInAt: Date;
}

export const AttendeeSchema = SchemaFactory.createForClass(Attendee);

// Apply soft delete middleware
applySoftDeleteMiddleware(AttendeeSchema);

AttendeeSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

AttendeeSchema.index({ eventId: 1, email: 1 }, { unique: true });

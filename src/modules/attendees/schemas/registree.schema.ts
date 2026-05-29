import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
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

  @Prop({ required: true, trim: true, lowercase: true, index: true })
  email: string;

  @Prop({ trim: true, index: true })
  phone: string;

  @Prop({ trim: true })
  organization: string;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Event' }],
    default: [],
  })
  eventIds: MongooseSchema.Types.ObjectId[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Website',
    required: false,
  })
  websiteId?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [
      {
        name: String,
        phone: String,
        organization: String,
        websiteId: { type: MongooseSchema.Types.ObjectId, ref: 'Website' },
        eventId: { type: MongooseSchema.Types.ObjectId, ref: 'Event' },
        passCode: String,
        qrCode: String,
        attended: { type: Boolean, default: false },
        attendedAt: Date,
        savedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  history: Array<{
    name: string;
    phone: string;
    organization: string;
    websiteId?: MongooseSchema.Types.ObjectId;
    eventId?: MongooseSchema.Types.ObjectId;
    passCode?: string;
    qrCode?: string;
    attended: boolean;
    attendedAt?: Date;
    savedAt: Date;
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

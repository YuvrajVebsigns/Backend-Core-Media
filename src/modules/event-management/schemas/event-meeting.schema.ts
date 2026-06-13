import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

@Schema({
  collection: 'event_meetings',
  timestamps: true,
})
export class EventMeeting extends BaseSchema {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true,
  })
  eventId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, required: true })
  agendaIndex: number;

  @Prop({ required: true, trim: true })
  agendaTime: string;

  @Prop({ required: true, trim: true })
  agendaTitle: string;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Attendee' }],
    required: true,
    default: [],
  })
  attendeeIds: MongooseSchema.Types.ObjectId[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Sponsor',
    required: true,
  })
  sponsorId: MongooseSchema.Types.ObjectId;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const EventMeetingSchema = SchemaFactory.createForClass(EventMeeting);

// Apply soft delete middleware
applySoftDeleteMiddleware(EventMeetingSchema);

EventMeetingSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

EventMeetingSchema.index({ eventId: 1, agendaIndex: 1 });

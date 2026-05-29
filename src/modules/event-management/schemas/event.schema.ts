import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

export enum EventType {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_GOING = 'ON_GOING',
  SCHEDULED = 'SCHEDULED',
  IN_REVIEW = 'IN_REVIEW',
}

@Schema({ _id: false })
class EventLocation {
  @Prop({ trim: true })
  address: string;

  @Prop({ trim: true })
  city: string;

  @Prop({ trim: true })
  mapLink: string;

  @Prop({ type: Number })
  lat: number;

  @Prop({ type: Number })
  lng: number;
}

@Schema({ _id: false })
class AgendaItem {
  @Prop({ required: true })
  time: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  speaker: string;

  @Prop({ trim: true })
  description: string;
}

@Schema({ _id: false })
export class EventSeo {
  @Prop({ trim: true })
  metaTitle: string;

  @Prop({ trim: true })
  metaDescription: string;

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ trim: true })
  ogImage: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'File' })
  ogImageId: MongooseSchema.Types.ObjectId;
}

@Schema({
  collection: 'events',
  timestamps: true,
})
export class Event extends BaseSchema {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  slug: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  description: any; // EditorJS content

  @Prop({ trim: true })
  excerpt: string;

  @Prop({
    type: String,
    enum: Object.values(EventType),
    default: EventType.OFFLINE,
  })
  type: EventType;

  @Prop({
    type: String,
    enum: Object.values(EventStatus),
    default: EventStatus.DRAFT,
    index: true,
  })
  status: EventStatus;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({ type: EventLocation })
  location: EventLocation;

  @Prop({ trim: true })
  meetingLink: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'File' })
  bannerImageId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Website' }],
    default: [],
  })
  websites: MongooseSchema.Types.ObjectId[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Sponsor' }],
    default: [],
  })
  sponsors: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [AgendaItem], default: [] })
  agenda: AgendaItem[];

  @Prop({ type: EventSeo, default: () => ({}) })
  seo: EventSeo;

  @Prop({ type: [String], default: [] })
  invitedEmails: string[];

  @Prop({ type: Number, default: 0 })
  totalRegistrations: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const EventSchema =
  SchemaFactory.createForClass(Event);

// Apply soft delete middleware
applySoftDeleteMiddleware(EventSchema);

EventSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

EventSchema.index({ websites: 1, isActive: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

@Schema({
  collection: 'analytics_events',
  timestamps: true,
})
export class AnalyticsEvent extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Website', required: true, index: true })
  websiteId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  visitorId: string;

  @Prop({ required: true, trim: true, index: true })
  sessionId: string;

  @Prop({ required: true, trim: true, index: true })
  eventType: string; // 'pageview', 'consent_accepted', 'consent_declined', 'interaction'

  @Prop({ required: false, trim: true })
  pageUrl?: string;

  @Prop({ required: false, trim: true })
  pageTitle?: string;

  @Prop({ required: false, trim: true })
  referrer?: string;

  @Prop({ required: false, trim: true })
  userAgent?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);

// Apply soft delete middleware
applySoftDeleteMiddleware(AnalyticsEventSchema);

AnalyticsEventSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

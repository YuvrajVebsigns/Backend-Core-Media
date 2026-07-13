import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';
import { CommunicationChannel } from './communication-log.schema';

@Schema({ _id: true })
export class EventMappingTrigger {
  @Prop({
    required: true,
    type: String,
    enum: Object.values(CommunicationChannel),
  })
  channel: CommunicationChannel;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'MessageTemplate',
    required: true,
  })
  templateId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  to: string; // The database field selection (e.g. 'nominatorId.email', 'phone')

  @Prop({ trim: true })
  cc?: string; // Additional target or admin backup email

  @Prop({ trim: true })
  bcc?: string;

  @Prop({ trim: true })
  senderEmail?: string;

  @Prop({ trim: true })
  senderName?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const EventMappingTriggerSchema =
  SchemaFactory.createForClass(EventMappingTrigger);

@Schema({
  collection: 'event_template_mappings',
  timestamps: true,
})
export class EventTemplateMapping extends BaseSchema {
  @Prop({ required: true, trim: true, unique: true, index: true })
  event: string;

  @Prop({
    type: [EventMappingTriggerSchema],
    default: [],
  })
  triggers: EventMappingTrigger[];

  // Root properties preserved as optional for backward compatibility
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'MessageTemplate',
    required: false,
    index: true,
  })
  templateId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: false, trim: true })
  to?: string;

  @Prop({ trim: true })
  cc?: string;

  @Prop({ trim: true })
  bcc?: string;

  @Prop({ trim: true })
  senderEmail?: string;

  @Prop({ trim: true })
  senderName?: string;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const EventTemplateMappingSchema =
  SchemaFactory.createForClass(EventTemplateMapping);

EventTemplateMappingSchema.index(
  { event: 1 },
  { unique: true, partialFilterExpression: { isDeleted: null } },
);

applySoftDeleteMiddleware(EventTemplateMappingSchema);

EventTemplateMappingSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

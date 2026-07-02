import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';
import { CommunicationChannel } from './communication-log.schema';

@Schema({
  _id: false,
})
export class ProviderSyncInfo {
  @Prop({ type: Number })
  templateId?: number; // External template ID (e.g. Brevo template ID)

  @Prop({ type: Date })
  syncedAt?: Date;

  @Prop({
    type: String,
    enum: ['synced', 'pending', 'failed'],
    default: 'pending',
  })
  syncStatus: 'synced' | 'pending' | 'failed';

  @Prop({ type: String })
  error?: string | null;
}

export const ProviderSyncInfoSchema =
  SchemaFactory.createForClass(ProviderSyncInfo);

@Schema({
  collection: 'message_templates',
  timestamps: true,
})
export class MessageTemplate extends BaseSchema {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, unique: true, index: true })
  slug: string; // Unique template ID/slug, e.g. 'user-welcome'

  @Prop({
    required: true,
    type: String,
    enum: Object.values(CommunicationChannel),
    index: true,
  })
  channel: CommunicationChannel;

  @Prop({ trim: true })
  subject: string; // Subject for emails, supports dynamic interpolations

  @Prop({ trim: true })
  htmlContent: string; // Email HTML content

  @Prop({ trim: true })
  textContent?: string; // Text content for SMS or email fallback

  @Prop({ type: [String], default: [] })
  variables: string[]; // Variable names expected in dynamic interpolations, e.g. ['name', 'url']

  @Prop({
    type: {
      brevo: { type: ProviderSyncInfoSchema, required: false },
      sendgrid: { type: ProviderSyncInfoSchema, required: false },
    },
    default: {},
  })
  providerSync: {
    brevo?: ProviderSyncInfo;
    sendgrid?: ProviderSyncInfo;
  };

  @Prop({ trim: true, required: false })
  senderEmail?: string;

  @Prop({ trim: true, required: false })
  senderName?: string;

  @Prop({ trim: true, required: false, index: true })
  linkedEvent?: string; // e.g. 'contact.submitted' — links template to a system event for variable discovery

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const MessageTemplateSchema =
  SchemaFactory.createForClass(MessageTemplate);

applySoftDeleteMiddleware(MessageTemplateSchema);

MessageTemplateSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

export enum CommunicationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
  WHATSAPP = 'whatsapp',
}

export enum CommunicationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  REQUESTED = 'requested',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  SPAM = 'spam',
  BLOCKED = 'blocked',
}

@Schema({
  collection: 'communication_logs',
  timestamps: true,
})
export class CommunicationLog extends BaseSchema {
  @Prop({
    required: true,
    type: String,
    enum: Object.values(CommunicationChannel),
    index: true,
  })
  channel: CommunicationChannel;

  @Prop({ required: true, trim: true, index: true })
  recipient: string;

  @Prop({ trim: true })
  sender: string;

  @Prop({ trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(CommunicationStatus),
    default: CommunicationStatus.PENDING,
    index: true,
  })
  status: CommunicationStatus;

  @Prop({ type: String, trim: true })
  error?: string | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Number, default: 0 })
  retryCount: number;
}

export const CommunicationLogSchema = SchemaFactory.createForClass(CommunicationLog);

// Apply soft delete middleware
applySoftDeleteMiddleware(CommunicationLogSchema);

// Index for fast Brevo webhook event matching by messageId
CommunicationLogSchema.index({ 'metadata.brevoMessageId': 1 }, { sparse: true });

CommunicationLogSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

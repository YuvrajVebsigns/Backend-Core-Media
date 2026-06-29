import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';
import { CommunicationChannel } from './communication-log.schema';

@Schema({
  collection: 'communication_providers',
  timestamps: true,
})
export class CommunicationProvider extends BaseSchema {
  @Prop({ required: true, trim: true, unique: true, index: true })
  name: string; // e.g. 'brevo', 'sendgrid'

  @Prop({ required: true, trim: true })
  displayName: string; // e.g. 'Brevo (Sendinblue)'

  @Prop({
    required: true,
    type: String,
    enum: Object.values(CommunicationChannel),
    index: true,
  })
  channel: CommunicationChannel;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  credentials: Record<string, any>; // API Keys, Secrets, etc.

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  config: Record<string, any>; // Extra settings, sender info, templates mapping

  @Prop({ type: Number, default: 0 })
  priority: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const CommunicationProviderSchema = SchemaFactory.createForClass(CommunicationProvider);

applySoftDeleteMiddleware(CommunicationProviderSchema);

CommunicationProviderSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    // Hide credentials in normal JSON outputs
    if (ret.credentials) {
      delete ret.credentials;
    }
    return ret;
  },
});

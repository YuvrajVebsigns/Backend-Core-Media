import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

@Schema({
  collection: 'webhook_subscriptions',
  timestamps: true,
})
export class WebhookSubscription extends BaseSchema {
  @Prop({ required: true, trim: true })
  url: string;

  @Prop({ type: [String], default: ['*'], index: true })
  events: string[];

  @Prop({ required: true, trim: true })
  secret: string;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const WebhookSubscriptionSchema =
  SchemaFactory.createForClass(WebhookSubscription);

// Apply soft delete middleware
applySoftDeleteMiddleware(WebhookSubscriptionSchema);

WebhookSubscriptionSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

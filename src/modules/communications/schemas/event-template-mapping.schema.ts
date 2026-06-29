import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

@Schema({
  collection: 'event_template_mappings',
  timestamps: true,
})
export class EventTemplateMapping extends BaseSchema {
  @Prop({ required: true, unique: true, index: true, trim: true })
  event: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'MessageTemplate',
    required: true,
    index: true,
  })
  templateId: MongooseSchema.Types.ObjectId;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const EventTemplateMappingSchema = SchemaFactory.createForClass(EventTemplateMapping);

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

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

  @Prop({ required: true, trim: true, lowercase: true, unique: true, index: true })
  email: string;

  @Prop({ trim: true, index: true })
  countryCode: string;

  @Prop({ trim: true, index: true })
  phoneNumber: string;

  @Prop({ trim: true })
  organization: string;

  @Prop({ trim: true })
  city: string;

  @Prop({
    type: [String],
    default: ['registree'],
    index: true,
  })
  tags: string[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Website',
    required: false,
  })
  websiteId?: MongooseSchema.Types.ObjectId;
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

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Document } from 'mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

export type CxoNetworkMemberDocument = CxoNetworkMember & Document;

@Schema({
  collection: 'cxo_network_members',
  timestamps: true,
})
export class CxoNetworkMember extends BaseSchema {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Registree',
    required: true,
    index: true,
  })
  registreeId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Website',
    required: true,
    index: true,
  })
  websiteId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ trim: true })
  title?: string;

  @Prop({ required: true, trim: true })
  currentDesignation: string;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  email: string;

  @Prop({ trim: true })
  telephoneNo?: string;

  @Prop({ trim: true })
  cioMobilePhone?: string;

  @Prop({ trim: true })
  linkedInLink?: string;

  @Prop({ required: true, trim: true })
  companyName: string;

  @Prop({ trim: true })
  companyAddress?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true })
  postalCode?: string;

  @Prop({ trim: true })
  country?: string;

  @Prop({
    type: String,
    enum: ['Enterprise', 'Startup', 'Government', 'Education', 'Other'],
    default: 'Other',
    index: true,
  })
  companyCategory?: string;

  @Prop({ trim: true })
  businessVertical?: string;
}

export const CxoNetworkMemberSchema =
  SchemaFactory.createForClass(CxoNetworkMember);

applySoftDeleteMiddleware(CxoNetworkMemberSchema);

CxoNetworkMemberSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

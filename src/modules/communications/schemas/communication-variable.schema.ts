import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  BaseSchema,
  applySoftDeleteMiddleware,
} from '@common/schemas/base.schema';

export enum VariableCategoryGroup {
  REGISTRATION = 'REGISTRATION',
  NOMINATION = 'NOMINATION',
  EVENT = 'EVENT',
  BLOG = 'BLOG',
  CONTACT = 'CONTACT',
  SPONSOR = 'SPONSOR',
  WEBSITE = 'WEBSITE',
  SYSTEM = 'SYSTEM',
  OTHER = 'OTHER',
}

@Schema({
  collection: 'communication_variables',
  timestamps: true,
})
export class CommunicationVariable extends BaseSchema {
  @Prop({ required: true, trim: true })
  name: string; // Friendly display name (e.g. "Registree Name")

  @Prop({ required: true, trim: true, index: true })
  path: string; // Key path (e.g. "registreeName" or "nominees.nomineeId.name")

  @Prop({ default: 'String', trim: true })
  type: string; // Variable data type (e.g. "String", "Number", "Date")

  @Prop({ default: false })
  isArray: boolean; // True if variable resolves to an array

  @Prop({ required: true, trim: true, index: true })
  modelName: string; // Base schema classification (e.g. "Registree", "Nomination")

  @Prop({
    required: true,
    type: String,
    enum: Object.values(VariableCategoryGroup),
    index: true,
  })
  categoryGroup: VariableCategoryGroup; // Logical grouping enum

  @Prop({ trim: true })
  description?: string; // Optional field explanation

  @Prop({ trim: true })
  ref?: string; // Referenced Mongoose collection name if relation (e.g. "Event")

  @Prop({ default: false, index: true })
  isSenderVariable: boolean; // Indicates if compatible for sender/recipient address mapping

  @Prop({ default: true, index: true })
  isActive: boolean; // Enabled status toggle
}

export const CommunicationVariableSchema = SchemaFactory.createForClass(
  CommunicationVariable,
);

// Compound index to ensure uniqueness of path within a model classification
CommunicationVariableSchema.index(
  { modelName: 1, path: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: null } },
);

applySoftDeleteMiddleware(CommunicationVariableSchema);

CommunicationVariableSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

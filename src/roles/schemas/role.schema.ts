import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema, applySoftDeleteMiddleware } from '../../common/schemas/base.schema';

@Schema({
  collection: 'roles',
  timestamps: true,
})
export class Role extends BaseSchema {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true })
  isShow: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

// Apply soft delete middleware
applySoftDeleteMiddleware(RoleSchema);

RoleSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

RoleSchema.set('toObject', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

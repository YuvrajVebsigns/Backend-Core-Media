import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

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

RoleSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

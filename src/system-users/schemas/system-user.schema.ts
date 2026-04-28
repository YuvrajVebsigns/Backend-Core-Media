import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';
import { Schema as MongooseSchema } from 'mongoose';
import { Role } from '../../roles/schemas/role.schema';

@Schema({
  collection: 'system_users',
  timestamps: true,
})
export class SystemUser extends BaseSchema {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Role.name,
    required: true,
  })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ select: false })
  refreshToken: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  profileImage: string;

  @Prop()
  lastLogin: Date;
}

export const SystemUserSchema = SchemaFactory.createForClass(SystemUser);

// Ensure _id to id transformation from BaseSchema is applied
const transform = (doc, ret: any) => {
  if (ret._id) ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  delete ret.password;
  delete ret.refreshToken;

  // Cleanup role
  if (ret.role) {
    if (typeof ret.role === 'object' && ret.role.name !== undefined) {
      // It's a populated role document
      const roleId = ret.role.id || (ret.role._id ? ret.role._id.toString() : null);
      ret.role = {
        id: roleId,
        name: ret.role.name,
        permissions: ret.role.permissions,
      };
    } else if (typeof ret.role === 'object') {
      // It's likely an unpopulated ObjectId
      ret.role = ret.role.toString();
    }
  }
  return ret;
};

SystemUserSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform,
});

SystemUserSchema.set('toObject', {
  getters: true,
  virtuals: true,
  transform,
});

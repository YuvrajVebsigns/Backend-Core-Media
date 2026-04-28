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

  @Prop()
  phoneNumber: string;

  @Prop()
  profileImage: string;

  @Prop()
  lastLogin: Date;
}

export const SystemUserSchema = SchemaFactory.createForClass(SystemUser);

// Ensure _id to id transformation from BaseSchema is applied
SystemUserSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password; // Extra security: always remove password from JSON
    return ret;
  },
});

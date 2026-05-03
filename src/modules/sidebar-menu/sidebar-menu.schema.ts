import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseSchema, applySoftDeleteMiddleware } from 'src/common/schemas/base.schema';

@Schema({ timestamps: true })
export class SidebarMenu extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  path: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SidebarMenu', default: null })
  parentId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  permissionKey: string;

  @Prop()
  icon?: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true })
  isVisible: boolean;

  @Prop()
  group?: string;
}

export const SidebarMenuSchema = SchemaFactory.createForClass(SidebarMenu);

// Apply soft delete middleware
applySoftDeleteMiddleware(SidebarMenuSchema);

SidebarMenuSchema.index({ permissionKey: 1 });
SidebarMenuSchema.index({ parentId: 1 });

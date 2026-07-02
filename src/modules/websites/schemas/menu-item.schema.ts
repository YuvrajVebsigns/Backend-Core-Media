import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { MenuType } from '../enums/menu-type.enum';

@Schema({ _id: false })
export class MenuItem {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  slug: string;

  @Prop({
    type: String,
    enum: Object.values(MenuType),
    default: MenuType.INTERNAL_PAGE,
  })
  menuType: MenuType;

  @Prop({ trim: true })
  target?: string; // e.g., _blank, _self

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'WebsitePage' })
  pageId?: MongooseSchema.Types.ObjectId;

  @Prop({ trim: true })
  icon?: string;

  @Prop({ default: true })
  isVisible: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}
export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { BaseSchema, applySoftDeleteMiddleware } from '@common/schemas/base.schema';
import { NavbarPosition } from '../enums/navbar-position.enum';
import { MenuItem, MenuItemSchema } from './menu-item.schema';

@Schema({ collection: 'website_navbars', timestamps: true })
export class Navbar extends BaseSchema {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Website', required: true, index: true })
  siteId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: String, enum: Object.values(NavbarPosition), default: NavbarPosition.HEADER })
  position: NavbarPosition;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isVisible: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Navbar' })
  parentId?: MongooseSchema.Types.ObjectId; // Support nested hierarchies

  @Prop({ type: [MenuItemSchema], default: [] })
  items: MenuItem[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SystemUser', required: true })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SystemUser' })
  updatedBy?: MongooseSchema.Types.ObjectId;
}
export const NavbarSchema = SchemaFactory.createForClass(Navbar);
applySoftDeleteMiddleware(NavbarSchema);

NavbarSchema.set('toJSON', {
  getters: true,
  virtuals: true,
  transform: (doc, ret: any) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

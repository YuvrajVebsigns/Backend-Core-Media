import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SidebarMenuController } from './sidebar-menu.controller';
import { SidebarMenuService } from './sidebar-menu.service';
import { SidebarMenu, SidebarMenuSchema } from './sidebar-menu.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SidebarMenu.name, schema: SidebarMenuSchema },
    ]),
  ],
  controllers: [SidebarMenuController],
  providers: [SidebarMenuService],
  exports: [SidebarMenuService],
})
export class SidebarMenuModule {}

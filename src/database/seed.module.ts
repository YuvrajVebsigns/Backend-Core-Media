import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { SystemUsersModule } from '../system-users/system-users.module';
import { SidebarMenuModule } from '../modules/sidebar-menu/sidebar-menu.module';
import { RolesSeeder } from './seeds/roles.seeder';
import { SystemUsersSeeder } from './seeds/system-users.seeder';
import { SidebarMenusSeeder } from './seeds/sidebar-menus.seeder';

@Module({
  imports: [RolesModule, SystemUsersModule, SidebarMenuModule],
  providers: [RolesSeeder, SystemUsersSeeder, SidebarMenusSeeder],
})
export class SeedModule { }

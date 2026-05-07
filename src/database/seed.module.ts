import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { SystemUsersModule } from '../system-users/system-users.module';
import { SidebarMenuModule } from '../modules/sidebar-menu/sidebar-menu.module';
import { WebsitesModule } from '../modules/websites/websites.module';
import { BlogsModule } from '../modules/blogs/blogs.module';
import { RolesSeeder } from './seeds/roles.seeder';
import { SystemUsersSeeder } from './seeds/system-users.seeder';
import { SidebarMenusSeeder } from './seeds/sidebar-menus.seeder';
import { WebsitesSeeder } from './seeds/websites.seeder';
import { BlogsSeeder } from './seeds/blogs.seeder';

@Module({
  imports: [RolesModule, SystemUsersModule, SidebarMenuModule, WebsitesModule, BlogsModule],
  providers: [RolesSeeder, SystemUsersSeeder, SidebarMenusSeeder, WebsitesSeeder, BlogsSeeder],
})
export class SeedModule { }

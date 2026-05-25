import { Module } from '@nestjs/common';
import { RolesModule } from '@core/roles/roles.module';
import { SystemUsersModule } from '@core/system-users/system-users.module';
import { SidebarMenuModule } from '@core/sidebar-menu/sidebar-menu.module';
import { WebsitesModule } from '@modules/websites/websites.module';
import { BlogsModule } from '@modules/blogs/blogs.module';
import { RolesSeeder } from '@database/seeds/roles.seeder';
import { SystemUsersSeeder } from '@database/seeds/system-users.seeder';
import { SidebarMenusSeeder } from '@database/seeds/sidebar-menus.seeder';
import { WebsitesSeeder } from '@database/seeds/websites.seeder';
import { BlogsSeeder } from '@database/seeds/blogs.seeder';
import { EventsSeeder } from '@database/seeds/events.seeder';
import { EventManagementModule } from '@modules/event-management/event-management.module';
import { WebsiteCmsSeeder } from '@database/seeds/website-cms.seeder';

@Module({
  imports: [
    RolesModule,
    SystemUsersModule,
    SidebarMenuModule,
    WebsitesModule,
    BlogsModule,
    EventManagementModule,
  ],
  providers: [
    RolesSeeder,
    SystemUsersSeeder,
    SidebarMenusSeeder,
    WebsitesSeeder,
    BlogsSeeder,
    EventsSeeder,
    WebsiteCmsSeeder,
  ],
})
export class SeedModule {}


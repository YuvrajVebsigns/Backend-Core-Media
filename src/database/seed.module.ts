import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesModule } from '@core/roles/roles.module';
import { SystemUsersModule } from '@core/system-users/system-users.module';
import { SidebarMenuModule } from '@core/sidebar-menu/sidebar-menu.module';
import { WebsitesModule } from '@modules/websites/websites.module';
import { BlogsModule } from '@modules/blogs/blogs.module';
import { SponsorsModule } from '@modules/sponsors/sponsors.module';
import { RolesSeeder } from '@database/seeds/roles.seeder';
import { SystemUsersSeeder } from '@database/seeds/system-users.seeder';
import { SidebarMenusSeeder } from '@database/seeds/sidebar-menus.seeder';
import { WebsitesSeeder } from '@database/seeds/websites.seeder';
import { BlogsSeeder } from '@database/seeds/blogs.seeder';
import { EventsSeeder } from '@database/seeds/events.seeder';
import { SponsorsSeeder } from '@database/seeds/sponsors.seeder';
import { CommunicationsProviderSeeder } from '@database/seeds/communications-provider.seeder';
import { EventManagementModule } from '@modules/event-management/event-management.module';
import { Sponsor, SponsorSchema } from '@modules/sponsors/schemas/sponsor.schema';
import { CommunicationProvider, CommunicationProviderSchema } from '@modules/communications/schemas/communication-provider.schema';

@Module({
  imports: [
    RolesModule,
    SystemUsersModule,
    SidebarMenuModule,
    WebsitesModule,
    BlogsModule,
    SponsorsModule,
    EventManagementModule,
    MongooseModule.forFeature([
      { name: Sponsor.name, schema: SponsorSchema },
      { name: CommunicationProvider.name, schema: CommunicationProviderSchema },
    ]),
  ],
  providers: [
    RolesSeeder,
    SystemUsersSeeder,
    SidebarMenusSeeder,
    WebsitesSeeder,
    BlogsSeeder,
    EventsSeeder,
    SponsorsSeeder,
    CommunicationsProviderSeeder,
  ],
})
export class SeedModule { }

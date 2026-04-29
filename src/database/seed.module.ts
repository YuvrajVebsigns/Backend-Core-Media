import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { SystemUsersModule } from '../system-users/system-users.module';
import { MenuModule } from '../modules/menu/menu.module';
import { RolesSeeder } from './seeds/roles.seeder';
import { SystemUsersSeeder } from './seeds/system-users.seeder';
import { MenusSeeder } from './seeds/menus.seeder';

@Module({
  imports: [RolesModule, SystemUsersModule, MenuModule],
  providers: [RolesSeeder, SystemUsersSeeder, MenusSeeder],
})
export class SeedModule { }

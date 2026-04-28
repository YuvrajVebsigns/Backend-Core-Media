import { Module } from '@nestjs/common';
import { RolesModule } from '../roles/roles.module';
import { SystemUsersModule } from '../system-users/system-users.module';
import { RolesSeeder } from './seeds/roles.seeder';
import { SystemUsersSeeder } from './seeds/system-users.seeder';

@Module({
  imports: [RolesModule, SystemUsersModule],
  providers: [RolesSeeder, SystemUsersSeeder],
})
export class SeedModule {}

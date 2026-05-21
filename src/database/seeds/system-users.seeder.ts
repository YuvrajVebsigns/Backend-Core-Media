import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SystemUsersService } from '@core/system-users/system-users.service';
import { RolesService } from '@core/roles/roles.service';
import { SystemUserRole } from '@common/enums/role.enum';

@Injectable()
export class SystemUsersSeeder implements OnApplicationBootstrap {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    private readonly rolesService: RolesService,
  ) {}

  async onApplicationBootstrap() {
    // Add a small delay to ensure RolesSeeder finishes first if they run in parallel
    // Alternatively, coordination can be done in a main seeder.
    setTimeout(async () => {
      await this.seed();
    }, 1000);
  }

  async seed() {
    const users = [
      {
        email: 'superadmin@gmail.com',
        password: 'admin@123',
        fullName: 'Super Admin',
        roleName: SystemUserRole.SUPER_ADMIN,
      },
      {
        email: 'admin@gmail.com',
        password: 'admin@123',
        fullName: 'Admin',
        roleName: SystemUserRole.ADMIN,
      },
      {
        email: 'staff@gmail.com',
        password: 'admin@123',
        fullName: 'Staff',
        roleName: SystemUserRole.STAFF,
      },
    ];

    for (const userData of users) {
      const existingUser = await this.systemUsersService.findByEmail(
        userData.email,
      );
      if (!existingUser) {
        const role = await this.rolesService.findByRoleKey(userData.roleName);
        if (role) {
          await this.systemUsersService.create({
            email: userData.email,
            password: userData.password,
            fullName: userData.fullName,
            role: role._id,
            isActive: true,
          });
          console.log(
            `✅ System User seeded: ${userData.email} (${userData.roleName})`,
          );
        } else {
          console.warn(
            `⚠️ Could not seed user ${userData.email}: Role ${userData.roleName} not found`,
          );
        }
      }
    }
  }
}

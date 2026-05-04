import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RolesService } from '../../roles/roles.service';
import { SystemUserRole } from '../../common/enums/role.enum';

@Injectable()
export class RolesSeeder implements OnApplicationBootstrap {
  constructor(private readonly rolesService: RolesService) { }

  async onApplicationBootstrap() {
    await this.seed();
  }

  async seed() {
    const roles = [
      {
        name: 'Super Admin',
        roleKey: SystemUserRole.SUPER_ADMIN,
        permissions: ['*'], // All permissions
        isActive: true,
        isShow: false,
      },
      {
        name: 'Admin',
        roleKey: SystemUserRole.ADMIN,
        permissions: ['*'],
        isActive: true,
        isShow: true,
      },
      {
        name: 'Staff',
        roleKey: SystemUserRole.STAFF,
        permissions: [],
        isActive: true,
        isShow: true,
      },
    ];

    for (const roleData of roles) {
      try {
        const existingRole = await this.rolesService.findByRoleKey(roleData.roleKey);
        if (!existingRole) {
          await this.rolesService.create(roleData);
          console.log(`✅ Role seeded: ${roleData.name} (${roleData.roleKey})`);
        }
      } catch (error) {
        // Handle race conditions during parallel tests
        if ((error as any).code !== 11000) {
          throw error;
        }
      }
    }
  }
}

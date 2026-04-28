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
        name: SystemUserRole.SUPER_ADMIN,
        permissions: ['*'], // All permissions
        isActive: true,
        isShow: false,
      },
      {
        name: SystemUserRole.ADMIN,
        permissions: ['*'],
        isActive: true,
        isShow: true,
      },
      {
        name: SystemUserRole.STAFF,
        permissions: [],
        isActive: true,
        isShow: true,
      },
    ];

    for (const roleData of roles) {
      const existingRole = await this.rolesService.findByName(roleData.name);
      if (!existingRole) {
        await this.rolesService.create(roleData);
        console.log(`✅ Role seeded: ${roleData.name}`);
      }
    }
  }
}

import { SetMetadata } from '@nestjs/common';
import { SystemUserRole } from '@common/enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: SystemUserRole[]) => SetMetadata(ROLES_KEY, roles);

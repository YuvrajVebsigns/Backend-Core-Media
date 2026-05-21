import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from './schemas/role.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PROTECTED_PERMISSIONS } from '@common/constants/permissions';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<Role>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async clearMenuCache() {
    try {
      const manager = this.cacheManager as any;
      if (manager.clear) await manager.clear();
      else if (manager.reset) await manager.reset();
      else if (manager.store?.clear) await manager.store.clear();
      else if (manager.store?.reset) await manager.store.reset();
    } catch (error) {
      console.warn('⚠️ Could not clear menu cache:', error.message);
    }
  }

  async create(createDto: any, currentUser?: any): Promise<Role> {
    // Check for protected permissions if not super_admin (only for requests with a user context)
    if (
      currentUser &&
      currentUser.role?.roleKey !== 'super_admin' &&
      createDto.permissions
    ) {
      const permissions = createDto.permissions;

      if (permissions.includes('*')) {
        throw new ForbiddenException(
          'Only Super Admin can assign all permissions ("*")',
        );
      }

      const protectedPerms = permissions.filter((p) =>
        PROTECTED_PERMISSIONS.includes(p),
      );
      if (protectedPerms.length > 0) {
        throw new ForbiddenException(
          `You do not have permission to assign protected permissions: ${protectedPerms.join(', ')}`,
        );
      }
    }

    const existingRole = await this.roleModel.findOne({
      $or: [{ name: createDto.name }, { roleKey: createDto.roleKey }],
    });
    if (existingRole) {
      if (existingRole.name === createDto.name) {
        throw new ConflictException('Role name already exists');
      }
      throw new ConflictException('Role key already exists');
    }

    // Explicitly prevent manual creation of super_admin role key if it already exists
    if (createDto.roleKey === 'super_admin') {
      const superAdminExists = await this.roleModel.findOne({
        roleKey: 'super_admin',
      });
      if (superAdminExists) {
        throw new ConflictException(
          'Super Admin role already exists and must be unique',
        );
      }
    }

    const newRole = new this.roleModel(createDto);
    return newRole.save();
  }

  async findAll(currentUser?: any): Promise<Role[]> {
    const query: any = { isDeleted: null };

    // If not super_admin, hide super_admin role
    if (currentUser?.role?.roleKey !== 'super_admin') {
      query.roleKey = { $ne: 'super_admin' };
    }

    return this.roleModel.find(query).exec();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleModel
      .findOne({ _id: id, isDeleted: null })
      .exec();
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleModel.findOne({ name, isDeleted: null }).exec();
  }

  async findByRoleKey(roleKey: string): Promise<Role | null> {
    return this.roleModel.findOne({ roleKey, isDeleted: null }).exec();
  }

  async update(id: string, updateDto: any, currentUser?: any): Promise<Role> {
    const role = await this.findOne(id);

    // Prevent modifying super_admin role by non-superadmins
    if (
      role.roleKey === 'super_admin' &&
      currentUser?.role?.roleKey !== 'super_admin'
    ) {
      throw new ForbiddenException(
        'Only Super Admin can modify the Super Admin role',
      );
    }

    // Prevent changing another role to super_admin
    if (updateDto.roleKey === 'super_admin' && role.roleKey !== 'super_admin') {
      throw new ForbiddenException('Cannot change a role to Super Admin');
    }

    // Check for protected permissions if not super_admin (only for requests with a user context)
    if (
      currentUser &&
      currentUser.role?.roleKey !== 'super_admin' &&
      updateDto.permissions
    ) {
      const currentPermissions = role.permissions || [];
      const newPermissions = updateDto.permissions;

      // Find permissions that are being ADDED
      const addedPermissions = newPermissions.filter(
        (p) => !currentPermissions.includes(p),
      );

      // Check if trying to add '*' (all permissions)
      if (addedPermissions.includes('*')) {
        throw new ForbiddenException(
          'Only Super Admin can assign all permissions ("*")',
        );
      }

      const addedProtected = addedPermissions.filter((p) =>
        PROTECTED_PERMISSIONS.includes(p),
      );

      if (addedProtected.length > 0) {
        throw new ForbiddenException(
          `You do not have permission to assign protected permissions: ${addedProtected.join(', ')}`,
        );
      }

      // Preserve existing protected permissions that the non-superadmin cannot see/manage
      const existingProtected = currentPermissions.filter((p) =>
        PROTECTED_PERMISSIONS.includes(p),
      );
      const finalPermissions = Array.from(
        new Set([...newPermissions, ...existingProtected]),
      );
      updateDto.permissions = finalPermissions;
    }

    if (updateDto.name || updateDto.roleKey) {
      const existing = await this.roleModel.findOne({
        _id: { $ne: id },
        isDeleted: null,
        $or: [
          ...(updateDto.name ? [{ name: updateDto.name }] : []),
          ...(updateDto.roleKey ? [{ roleKey: updateDto.roleKey }] : []),
        ],
      });
      if (existing) {
        if (updateDto.name && existing.name === updateDto.name) {
          throw new ConflictException('Role name already exists');
        }
        throw new ConflictException('Role key already exists');
      }
    }

    const updatedRole = await this.roleModel
      .findOneAndUpdate({ _id: id }, updateDto, { returnDocument: 'after' })
      .exec();

    if (!updatedRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await this.clearMenuCache();
    return updatedRole;
  }

  async remove(id: string, currentUser?: any): Promise<void> {
    const role = await this.findOne(id);

    if (role.roleKey === 'super_admin') {
      throw new ForbiddenException('The Super Admin role cannot be deleted');
    }

    // If not super_admin, they shouldn't even be able to see/access it (findOne will handle simple visibility but this is extra safety)
    if (
      role.roleKey === 'super_admin' &&
      currentUser?.role?.roleKey !== 'super_admin'
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete the Super Admin role',
      );
    }

    const result = await this.roleModel
      .updateOne({ _id: id }, { isDeleted: new Date() })
      .exec();
    if (result.matchedCount === 0) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    await this.clearMenuCache();
  }
}

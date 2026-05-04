import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from './schemas/role.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<Role>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

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

  async create(createDto: any): Promise<Role> {
    const existingRole = await this.roleModel.findOne({ 
      $or: [
        { name: createDto.name },
        { roleKey: createDto.roleKey }
      ]
    });
    if (existingRole) {
      if (existingRole.name === createDto.name) {
        throw new ConflictException('Role name already exists');
      }
      throw new ConflictException('Role key already exists');
    }
    const newRole = new this.roleModel(createDto);
    return newRole.save();
  }

  async findAll(): Promise<Role[]> {
    return this.roleModel.find().exec();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleModel.findOne({ _id: id }).exec();
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleModel.findOne({ name }).exec();
  }

  async findByRoleKey(roleKey: string): Promise<Role | null> {
    return this.roleModel.findOne({ roleKey }).exec();
  }

  async update(id: string, updateDto: any): Promise<Role> {
    if (updateDto.name || updateDto.roleKey) {
      const existing = await this.roleModel.findOne({
        _id: { $ne: id },
        $or: [
          ...(updateDto.name ? [{ name: updateDto.name }] : []),
          ...(updateDto.roleKey ? [{ roleKey: updateDto.roleKey }] : [])
        ]
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

  async remove(id: string): Promise<void> {
    const result = await this.roleModel.updateOne({ _id: id }, { isDeleted: new Date() }).exec();
    if (result.matchedCount === 0) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    await this.clearMenuCache();
  }
}

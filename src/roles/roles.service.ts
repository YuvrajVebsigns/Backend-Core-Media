import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from './schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private roleModel: Model<Role>) { }

  async create(createDto: any): Promise<Role> {
    const existingRole = await this.roleModel.findOne({ name: createDto.name });
    if (existingRole) {
      throw new ConflictException('Role name already exists');
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

  async update(id: string, updateDto: any): Promise<Role> {
    const updatedRole = await this.roleModel
      .findOneAndUpdate({ _id: id }, updateDto, { returnDocument: 'after' })
      .exec();

    if (!updatedRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return updatedRole;
  }

  async remove(id: string): Promise<void> {
    const result = await this.roleModel.updateOne({ _id: id }, { isDeleted: new Date() }).exec();
    if (result.matchedCount === 0) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }
}

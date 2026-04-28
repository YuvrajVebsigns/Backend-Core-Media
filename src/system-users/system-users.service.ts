import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemUser } from './schemas/system-user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SystemUsersService {
  constructor(
    @InjectModel(SystemUser.name) private systemUserModel: Model<SystemUser>,
  ) {}

  async create(createDto: any): Promise<SystemUser> {
    const { email, password } = createDto;
    
    const existingUser = await this.systemUserModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new this.systemUserModel({
      ...createDto,
      password: hashedPassword,
    });

    return newUser.save();
  }

  async findAll(): Promise<SystemUser[]> {
    return this.systemUserModel.find({ isDeleted: false }).populate('role').exec();
  }

  async findOne(id: string): Promise<SystemUser> {
    const user = await this.systemUserModel
      .findOne({ _id: id, isDeleted: false })
      .populate('role')
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<SystemUser | null> {
    return this.systemUserModel.findOne({ email, isDeleted: false }).select('+password').exec();
  }

  async update(id: string, updateDto: any): Promise<SystemUser> {
    if (updateDto.password) {
      updateDto.password = await bcrypt.hash(updateDto.password, 10);
    }

    const updatedUser = await this.systemUserModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, updateDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.systemUserModel.updateOne({ _id: id }, { isDeleted: true }).exec();
    if (result.matchedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}

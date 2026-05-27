import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SystemUser } from './schemas/system-user.schema';
import * as bcrypt from 'bcrypt';
import { QuerySystemUserDto } from './dto/system-user.dto';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';
import { SystemUserRole } from '@common/enums/role.enum';

@Injectable()
export class SystemUsersService {
  constructor(
    @InjectModel(SystemUser.name) private systemUserModel: Model<SystemUser>,
  ) {}

  private sanitizeImageUrls(dto: any) {
    if (dto.profileImageId && dto.profileImage?.startsWith('http')) {
      delete dto.profileImage;
    }
  }

  async create(createDto: any): Promise<SystemUser> {
    const { email, password } = createDto;

    // Check for existing email including soft-deleted users
    const existingUser = await this.systemUserModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('This email already exists in the database');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    this.sanitizeImageUrls(createDto);

    const newUser = new this.systemUserModel({
      ...createDto,
      password: hashedPassword,
    });

    try {
      const savedUser = await newUser.save();
      return savedUser.populate(['role', 'profileImageId']);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(
          'This email already exists in the database',
        );
      }
      throw error;
    }
  }

  async findAll(
    queryDto: QuerySystemUserDto,
    currentUser: any,
  ): Promise<PaginatedResponseDto<SystemUser>> {
    const {
      page = 1,
      limit = 10,
      search,
      roleId,
      isActive,
      sort,
      filters,
    } = queryDto;
    const skip = (page - 1) * limit;

    const matchQuery: any = { isDeleted: null };

    // Standard Filters
    if (roleId) {
      matchQuery.role = new Types.ObjectId(roleId);
    }

    if (isActive !== undefined) {
      matchQuery.isActive = isActive === true;
    }

    if (filters) {
      Object.assign(matchQuery, filters);
    }

    const pipeline: any[] = [{ $match: matchQuery }];

    // Join with Roles to enable searching by role name and filtering by roleKey
    pipeline.push(
      {
        $lookup: {
          from: 'roles', // Ensure this matches your actual roles collection name
          localField: 'role',
          foreignField: '_id',
          as: 'roleInfo',
        },
      },
      { $unwind: { path: '$roleInfo', preserveNullAndEmptyArrays: true } },
    );

    // Join with Files for profileImageId
    pipeline.push(
      {
        $lookup: {
          from: 'files',
          localField: 'profileImageId',
          foreignField: '_id',
          as: 'profileImageInfo',
        },
      },
      {
        $unwind: {
          path: '$profileImageInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
    );

    // Conditionally exclude Super Admins:
    // If current user is NOT a Super Admin, they cannot see other Super Admins.
    if (currentUser?.role?.roleKey !== SystemUserRole.SUPER_ADMIN) {
      pipeline.push({
        $match: {
          'roleInfo.roleKey': { $ne: SystemUserRole.SUPER_ADMIN },
        },
      });
    }

    // Global Search Logic
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const searchConditions: any[] = [
        { fullName: searchRegex },
        { email: searchRegex },
        { 'roleInfo.name': searchRegex },
      ];

      // Handle "active"/"inactive" text search
      if (search.toLowerCase() === 'active') {
        searchConditions.push({ isActive: true });
      } else if (search.toLowerCase() === 'inactive') {
        searchConditions.push({ isActive: false });
      }

      pipeline.push({ $match: { $or: searchConditions } });
    }

    // Sort Logic
    const sortOption: any = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOption.createdAt = -1;
    }
    pipeline.push({ $sort: sortOption });

    // Pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const dataPipeline = [...pipeline, { $skip: skip }, { $limit: limit }];

    const [data, countResult] = await Promise.all([
      this.systemUserModel.aggregate(dataPipeline).exec(),
      this.systemUserModel.aggregate(countPipeline).exec(),
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Map _id to id and ensure role structure matches response DTO
    const mappedData = data.map((user) => ({
      ...user,
      id: user._id.toString(),
      role: user.roleInfo
        ? { ...user.roleInfo, id: user.roleInfo._id.toString() }
        : null,
      profileImageId: user.profileImageInfo
        ? { ...user.profileImageInfo, id: user.profileImageInfo._id.toString() }
        : null,
    }));

    return {
      data: mappedData,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<SystemUser> {
    const user = await this.systemUserModel
      .findOne({ _id: id })
      .populate(['role', 'profileImageId'])
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findOneWithRefreshToken(id: string): Promise<SystemUser | null> {
    return this.systemUserModel
      .findOne({ _id: id })
      .select('+refreshToken')
      .populate(['role', 'profileImageId'])
      .exec();
  }

  async findByEmail(email: string): Promise<SystemUser | null> {
    return this.systemUserModel.findOne({ email }).select('+password').populate('role').exec();
  }

  async update(id: string, updateDto: any): Promise<SystemUser> {
    if (updateDto.password) {
      updateDto.password = await bcrypt.hash(updateDto.password, 10);
    }

    this.sanitizeImageUrls(updateDto);

    const updatedUser = await this.systemUserModel
      .findOneAndUpdate({ _id: id }, updateDto, { returnDocument: 'after' })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.systemUserModel
      .updateOne({ _id: id }, { isDeleted: new Date() })
      .exec();
    if (result.matchedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}

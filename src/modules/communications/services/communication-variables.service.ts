import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunicationVariable } from '../schemas/communication-variable.schema';
import {
  CreateCommunicationVariableDto,
  UpdateCommunicationVariableDto,
  QueryCommunicationVariableDto,
} from '../dto/communication-variable.dto';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';

@Injectable()
export class CommunicationVariablesService {
  private readonly logger = new Logger(CommunicationVariablesService.name);

  constructor(
    @InjectModel(CommunicationVariable.name)
    private readonly variableModel: Model<CommunicationVariable>,
  ) {}

  private deduceIsSenderVariable(path: string): boolean {
    if (!path) return false;
    const lowerPath = path.toLowerCase();
    return (
      lowerPath.endsWith('email') ||
      lowerPath.endsWith('emailaddress') ||
      lowerPath.endsWith('phone') ||
      lowerPath.endsWith('phonenumber') ||
      lowerPath.endsWith('mobile') ||
      lowerPath.endsWith('recipient') ||
      lowerPath.endsWith('token') ||
      lowerPath.endsWith('webhookurl') ||
      lowerPath.endsWith('url')
    );
  }

  async create(
    dto: CreateCommunicationVariableDto,
  ): Promise<CommunicationVariable> {
    try {
      const isSender =
        dto.isSenderVariable || this.deduceIsSenderVariable(dto.path);
      const variable = new this.variableModel({
        ...dto,
        isSenderVariable: isSender,
      });
      return await variable.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Variable with path "${dto.path}" already exists for schema "${dto.modelName}".`,
        );
      }
      throw error;
    }
  }

  async findAll(
    queryDto: QueryCommunicationVariableDto,
  ): Promise<PaginatedResponseDto<CommunicationVariable>> {
    const {
      page = 1,
      limit = 10,
      search,
      modelName,
      categoryGroup,
      isActive,
      isSenderVariable,
    } = queryDto;
    const skip = (page - 1) * limit;

    const matchQuery: any = { isDeleted: null };

    if (modelName) {
      matchQuery.modelName = modelName;
    }

    if (categoryGroup) {
      matchQuery.categoryGroup = categoryGroup;
    }

    if (isActive !== undefined) {
      matchQuery.isActive = isActive;
    }

    if (isSenderVariable !== undefined) {
      matchQuery.isSenderVariable = isSenderVariable;
    }

    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { path: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.variableModel
        .find(matchQuery)
        .sort({ modelName: 1, path: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.variableModel.countDocuments(matchQuery).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
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

  async findOne(id: string): Promise<CommunicationVariable> {
    const variable = await this.variableModel
      .findOne({ _id: id, isDeleted: null })
      .exec();
    if (!variable) {
      throw new NotFoundException(
        `Communication variable with ID "${id}" not found.`,
      );
    }
    return variable;
  }

  async update(
    id: string,
    dto: UpdateCommunicationVariableDto,
  ): Promise<CommunicationVariable> {
    const variable = await this.findOne(id);

    const merged = { ...dto };
    if (dto.path !== undefined) {
      merged.isSenderVariable =
        dto.isSenderVariable !== undefined
          ? dto.isSenderVariable
          : this.deduceIsSenderVariable(dto.path);
    } else if (dto.isSenderVariable !== undefined) {
      merged.isSenderVariable = dto.isSenderVariable;
    }

    Object.assign(variable, merged);

    try {
      return await variable.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Variable with path "${dto.path || variable.path}" already exists for schema "${dto.modelName || variable.modelName}".`,
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<CommunicationVariable> {
    const variable = await this.findOne(id);
    variable.isDeleted = new Date();
    return variable.save();
  }
}

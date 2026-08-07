import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NominationSubCategory } from './schemas/nomination-sub-category.schema';
import {
  CreateNominationCategoryDto,
  UpdateNominationCategoryDto,
  QueryNominationCategoryDto,
} from './dto/nomination-sub-category.dto';

@Injectable()
export class NominationSubCategoriesService {
  constructor(
    @InjectModel(NominationSubCategory.name)
    private readonly subCategoryModel: Model<NominationSubCategory>,
  ) {}

  async create(
    createDto: CreateNominationCategoryDto,
  ): Promise<NominationSubCategory> {
    const existing = await this.subCategoryModel
      .findOne({ slug: createDto.slug })
      .exec();
    if (existing) {
      throw new ConflictException(
        `Sub category with slug "${createDto.slug}" already exists`,
      );
    }

    const category = new this.subCategoryModel(createDto);
    return category.save();
  }

  async findAll(queryDto: QueryNominationCategoryDto) {
    const page = Number(queryDto.page || 1);
    const limit = Number(queryDto.limit || 10);
    const skip = (page - 1) * limit;

    const matchQuery: any = {};

    if (queryDto.isActive !== undefined) {
      matchQuery.isActive = queryDto.isActive;
    }

    if (queryDto.search) {
      const searchRegex = { $regex: queryDto.search, $options: 'i' };
      matchQuery.$or = [{ name: searchRegex }, { slug: searchRegex }];
    }

    const [data, total] = await Promise.all([
      this.subCategoryModel
        .find(matchQuery)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.subCategoryModel.countDocuments(matchQuery).exec(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllActive(): Promise<NominationSubCategory[]> {
    return this.subCategoryModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .exec();
  }

  async findOne(id: string): Promise<NominationSubCategory> {
    const category = await this.subCategoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(
        `Nomination sub category with ID ${id} not found`,
      );
    }
    return category;
  }

  async update(
    id: string,
    updateDto: UpdateNominationCategoryDto,
  ): Promise<NominationSubCategory> {
    const category = await this.subCategoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(
        `Nomination sub category with ID ${id} not found`,
      );
    }

    if (updateDto.slug !== undefined && updateDto.slug !== category.slug) {
      const existing = await this.subCategoryModel
        .findOne({ slug: updateDto.slug, _id: { $ne: id } })
        .exec();
      if (existing) {
        throw new ConflictException(
          `Sub category with slug "${updateDto.slug}" already exists`,
        );
      }
    }

    if (updateDto.name !== undefined) category.name = updateDto.name;
    if (updateDto.slug !== undefined) category.slug = updateDto.slug;
    if (updateDto.isActive !== undefined)
      category.isActive = updateDto.isActive;
    if (updateDto.sortOrder !== undefined)
      category.sortOrder = updateDto.sortOrder;

    return category.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.subCategoryModel
      .findByIdAndUpdate(id, { isDeleted: new Date() })
      .exec();

    if (!result) {
      throw new NotFoundException(
        `Nomination sub category with ID ${id} not found`,
      );
    }
  }
}

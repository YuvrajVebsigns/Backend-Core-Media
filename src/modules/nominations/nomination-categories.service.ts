import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NominationCategory } from './schemas/nomination-category.schema';
import {
  CreateNominationCategoryDto,
  UpdateNominationCategoryDto,
  QueryNominationCategoryDto,
} from './dto/nomination-category.dto';

@Injectable()
export class NominationCategoriesService {
  constructor(
    @InjectModel(NominationCategory.name)
    private readonly categoryModel: Model<NominationCategory>,
  ) {}

  /**
   * Create a new nomination category
   */
  async create(createDto: CreateNominationCategoryDto): Promise<NominationCategory> {
    const existing = await this.categoryModel.findOne({ slug: createDto.slug }).exec();
    if (existing) {
      throw new ConflictException(`Category with slug "${createDto.slug}" already exists`);
    }

    const category = new this.categoryModel(createDto);
    return category.save();
  }

  /**
   * Get all categories with pagination and filters
   */
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
      matchQuery.$or = [
        { name: searchRegex },
        { slug: searchRegex },
      ];
    }

    const [data, total] = await Promise.all([
      this.categoryModel
        .find(matchQuery)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.categoryModel.countDocuments(matchQuery).exec(),
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

  /**
   * Get all active categories (for dropdowns)
   */
  async findAllActive(): Promise<NominationCategory[]> {
    return this.categoryModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .exec();
  }

  /**
   * Get one category by ID
   */
  async findOne(id: string): Promise<NominationCategory> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Nomination category with ID ${id} not found`);
    }
    return category;
  }

  /**
   * Update a category
   */
  async update(
    id: string,
    updateDto: UpdateNominationCategoryDto,
  ): Promise<NominationCategory> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Nomination category with ID ${id} not found`);
    }

    if (updateDto.slug !== undefined && updateDto.slug !== category.slug) {
      const existing = await this.categoryModel
        .findOne({ slug: updateDto.slug, _id: { $ne: id } })
        .exec();
      if (existing) {
        throw new ConflictException(`Category with slug "${updateDto.slug}" already exists`);
      }
    }

    if (updateDto.name !== undefined) category.name = updateDto.name;
    if (updateDto.slug !== undefined) category.slug = updateDto.slug;
    if (updateDto.isActive !== undefined) category.isActive = updateDto.isActive;
    if (updateDto.sortOrder !== undefined) category.sortOrder = updateDto.sortOrder;

    return category.save();
  }

  /**
   * Soft delete a category
   */
  async remove(id: string): Promise<void> {
    const result = await this.categoryModel
      .findByIdAndUpdate(id, { isDeleted: new Date() })
      .exec();

    if (!result) {
      throw new NotFoundException(`Nomination category with ID ${id} not found`);
    }
  }
}

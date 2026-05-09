import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog } from './schemas/blog.schema';
import { CreateBlogDto, UpdateBlogDto, QueryBlogDto } from './dto/blog.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { BlogStatus } from './enums/blog-status.enum';
import { AutoArchiveDuration } from './enums/auto-archive-duration.enum';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<Blog>,
  ) { }

  private calculateArchiveDate(publishedAt: Date, duration: AutoArchiveDuration): Date {
    const date = new Date(publishedAt);
    switch (duration) {
      case AutoArchiveDuration.THREE_MONTHS:
        date.setMonth(date.getMonth() + 3);
        break;
      case AutoArchiveDuration.SIX_MONTHS:
        date.setMonth(date.getMonth() + 6);
        break;
      case AutoArchiveDuration.ONE_YEAR:
        date.setFullYear(date.getFullYear() + 1);
        break;
      case AutoArchiveDuration.THREE_YEARS:
        date.setFullYear(date.getFullYear() + 3);
        break;
    }
    return date;
  }

  private handleStatusTransitions(dto: any, existingBlog?: Blog) {
    // If status is not provided, we don't change isActive unless it's a new blog
    if (dto.status) {
      if (dto.status === BlogStatus.PUBLISHED) {
        dto.isActive = true;
        if (!existingBlog?.publishedAt && !dto.publishedAt) {
          dto.publishedAt = new Date();
        }
      } else {
        dto.isActive = false;
      }
    }

    const publishedAt = dto.publishedAt || existingBlog?.publishedAt;
    const duration = dto.autoArchiveDuration || (dto.autoArchiveDuration === null ? null : existingBlog?.autoArchiveDuration);

    if (publishedAt && duration) {
      dto.autoArchiveAt = this.calculateArchiveDate(publishedAt, duration);
    } else if (dto.autoArchiveDuration === null) {
      dto.autoArchiveAt = null;
    }
  }

  async create(createDto: CreateBlogDto, authorId: string): Promise<Blog> {
    const { slug } = createDto;

    const existingBlog = await this.blogModel.findOne({ slug });
    if (existingBlog) {
      throw new ConflictException('Blog with this slug already exists');
    }

    this.handleStatusTransitions(createDto);

    const newBlog = new this.blogModel({
      ...createDto,
      author: authorId,
    });
    return newBlog.save();
  }

  async findAll(queryDto: QueryBlogDto): Promise<PaginatedResponseDto<Blog>> {
    const { page = 1, limit = 10, search, isActive, websiteId, sort } = queryDto;
    const skip = (page - 1) * limit;

    const matchQuery: any = {};

    if (isActive !== undefined) {
      matchQuery.isActive = isActive;
    }

    if (queryDto.status) {
      matchQuery.status = queryDto.status;
    }

    if (websiteId) {
      matchQuery.websites = { $in: [websiteId] };
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const orConditions: any[] = [
        { title: searchRegex },
        { slug: searchRegex },
        { tags: searchRegex },
      ];

      const lowerSearch = search.toLowerCase();
      if (lowerSearch === 'published' || lowerSearch === 'active') {
        orConditions.push({ isActive: true });
      } else if (lowerSearch === 'draft' || lowerSearch === 'drafts' || lowerSearch === 'inactive') {
        orConditions.push({ isActive: false });
      }

      matchQuery.$or = orConditions;
    }

    const sortOption: any = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOption.createdAt = -1;
    }

    const [data, total] = await Promise.all([
      this.blogModel
        .find(matchQuery)
        .populate('author', 'fullName email profileImage')
        .populate('websites', 'name domain logo')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.blogModel.countDocuments(matchQuery).exec(),
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

  async findOne(id: string): Promise<Blog> {
    const blog = await this.blogModel
      .findById(id)
      .populate('author', 'fullName email profileImage')
      .populate('websites', 'name domain logo')
      .exec();

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
    return blog;
  }

  async findBySlug(slug: string): Promise<Blog | null> {
    return this.blogModel.findOne({ slug }).exec();
  }

  async update(id: string, updateDto: UpdateBlogDto): Promise<Blog> {
    const existingBlog = await this.blogModel.findById(id).exec();
    if (!existingBlog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    this.handleStatusTransitions(updateDto, existingBlog);

    const blog = await this.blogModel
      .findByIdAndUpdate(id, updateDto, { returnDocument: 'after' })
      .exec();

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    return blog;
  }

  async remove(id: string): Promise<void> {
    const result = await this.blogModel
      .updateOne({ _id: id }, { isDeleted: new Date() })
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
  }
}

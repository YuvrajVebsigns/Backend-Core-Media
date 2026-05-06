import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog } from './schemas/blog.schema';
import { CreateBlogDto, UpdateBlogDto, QueryBlogDto } from './dto/blog.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<Blog>,
  ) {}

  async create(createDto: CreateBlogDto, authorId: string): Promise<Blog> {
    const { slug } = createDto;

    const existingBlog = await this.blogModel.findOne({ slug });
    if (existingBlog) {
      throw new ConflictException('Blog with this slug already exists');
    }

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
    const blog = await this.blogModel
      .findByIdAndUpdate(id, updateDto, { new: true })
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

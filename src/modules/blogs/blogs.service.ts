import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import { Blog } from './schemas/blog.schema';
import { BlogComment, BlogCommentDocument } from './schemas/comment.schema';
import { CreateBlogDto, UpdateBlogDto, QueryBlogDto } from './dto/blog.dto';
import { CreateCommentDto, UpdateCommentStatusDto } from './dto/comment.dto';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';
import { BlogStatus } from './enums/blog-status.enum';
import { AutoArchiveDuration } from './enums/auto-archive-duration.enum';
import { UrlService } from '@core/files/services/url.service';

/** Only fetch the fields we need from the File document when populating */
const IMAGE_POPULATE_SELECT = '_id key variants metadata';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<Blog>,
    @InjectModel(BlogComment.name)
    private commentModel: Model<BlogCommentDocument>,
    @InjectQueue('blog-engagement') private engagementQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly urlService: UrlService,
  ) { }

  /**
   * Transform populated File references into lean image objects:
   * { id, metadata, url, urlVariants }
   *
   * Also enriches the `featureImage` field with variant URLs.
   */
  private transformImageFields(blog: any): any {
    if (!blog) return blog;

    const obj = blog.toJSON ? blog.toJSON() : { ...blog };

    // Transform featureImageId — only if it was actually populated (has 'key')
    if (obj.featureImageId && typeof obj.featureImageId === 'object' && obj.featureImageId.key) {
      const file = obj.featureImageId;
      const url = this.urlService.getPublicUrl(file.key);
      const urlVariants = file.variants
        ? this.urlService.getVariantUrls(file.variants)
        : {};

      obj.featureImageId = {
        id: file.id || file._id,
        metadata: file.metadata || {},
        url,
        urlVariants,
      };

      // Enrich featureImage with variant URLs
      obj.featureImage = {
        original: url,
        ...urlVariants,
      };
    }

    // Transform seo.ogImageId — only if it was actually populated (has 'key')
    if (obj.seo?.ogImageId && typeof obj.seo.ogImageId === 'object' && obj.seo.ogImageId.key) {
      const file = obj.seo.ogImageId;
      const url = this.urlService.getPublicUrl(file.key);
      const urlVariants = file.variants
        ? this.urlService.getVariantUrls(file.variants)
        : {};

      obj.seo.ogImageId = {
        id: file.id || file._id,
        metadata: file.metadata || {},
        url,
        urlVariants,
      };

      // Enrich seo.ogImage with variant URLs
      obj.seo.ogImage = {
        original: url,
        ...urlVariants,
      };
    }

    return obj;
  }

  private sanitizeImageUrls(dto: any) {
    if (dto.featureImageId && dto.featureImage?.startsWith('http')) {
      delete dto.featureImage;
    }
    if (dto.seo?.ogImageId && dto.seo?.ogImage?.startsWith('http')) {
      delete dto.seo.ogImage;
    }
  }

  private calculateArchiveDate(
    publishedAt: Date,
    duration: AutoArchiveDuration,
  ): Date {
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
    const duration =
      dto.autoArchiveDuration ||
      (dto.autoArchiveDuration === null
        ? null
        : existingBlog?.autoArchiveDuration);

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
    this.sanitizeImageUrls(createDto);

    const newBlog = new this.blogModel({
      ...createDto,
      author: authorId,
    });
    return newBlog.save();
  }

  private buildMatchQuery(queryDto: QueryBlogDto): any {
    const { search, isActive, websiteId } = queryDto;
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
      } else if (
        lowerSearch === 'draft' ||
        lowerSearch === 'drafts' ||
        lowerSearch === 'inactive'
      ) {
        orConditions.push({ isActive: false });
      }

      matchQuery.$or = orConditions;
    }

    return matchQuery;
  }

  private buildSortOption(sort?: string): any {
    const sortOption: any = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOption.createdAt = -1;
    }
    return sortOption;
  }

  async findAll(queryDto: QueryBlogDto): Promise<PaginatedResponseDto<Blog>> {
    const { page = 1, limit = 10, sort } = queryDto;
    const skip = (page - 1) * limit;

    const matchQuery = this.buildMatchQuery(queryDto);
    const sortOption = this.buildSortOption(sort);

    const [rawData, total] = await Promise.all([
      this.blogModel
        .find(matchQuery)
        .populate('author', 'fullName email profileImage')
        .populate('websites', 'name domain logo')
        .populate('seo.ogImageId', IMAGE_POPULATE_SELECT)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.blogModel.countDocuments(matchQuery).exec(),
    ]);

    const data = rawData.map((blog) => this.transformImageFields(blog));

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

  /**
   * Website-facing findAll — returns only summary fields (no content/heavy data)
   */
  async findAllForWebsite(
    queryDto: QueryBlogDto,
  ): Promise<PaginatedResponseDto<Partial<Blog>>> {
    const { page = 1, limit = 10, sort } = queryDto;
    const skip = (page - 1) * limit;

    const matchQuery = this.buildMatchQuery(queryDto);
    const sortOption = this.buildSortOption(sort);

    // Only select summary fields needed for listing
    const summaryProjection = {
      title: 1,
      slug: 1,
      excerpt: 1,
      featureImage: 1,
      featureImageId: 1,
      tags: 1,
      status: 1,
      isActive: 1,
      engagement: 1,
      seo: 1,
      author: 1,
      websites: 1,
      createdAt: 1,
      publishedAt: 1,
    };

    const [rawData, total] = await Promise.all([
      this.blogModel
        .find(matchQuery, summaryProjection)
        .populate('author', 'fullName email profileImage')
        .populate('websites', 'name domain logo')
        .populate('featureImageId', IMAGE_POPULATE_SELECT)
        .populate('seo.ogImageId', IMAGE_POPULATE_SELECT)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.blogModel.countDocuments(matchQuery).exec(),
    ]);

    const data = rawData.map((blog) => this.transformImageFields(blog));

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
      .populate('featureImageId', IMAGE_POPULATE_SELECT)
      .populate('seo.ogImageId', IMAGE_POPULATE_SELECT)
      .exec();

    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
    return this.transformImageFields(blog);
  }

  async findBySlug(slug: string): Promise<any> {
    const blog = await this.blogModel
      .findOne({ slug })
      .populate('author', 'fullName email profileImage')
      .populate('websites', 'name domain logo')
      .populate('featureImageId', IMAGE_POPULATE_SELECT)
      .populate('seo.ogImageId', IMAGE_POPULATE_SELECT)
      .exec();

    if (!blog) return null;
    return this.transformImageFields(blog);
  }

  async update(id: string, updateDto: UpdateBlogDto): Promise<Blog> {
    const existingBlog = await this.blogModel.findById(id).exec();
    if (!existingBlog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }

    this.handleStatusTransitions(updateDto, existingBlog);
    this.sanitizeImageUrls(updateDto);

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

  private async bufferEngagement(
    blogId: string,
    type: 'likes' | 'views' | 'comments',
  ) {
    const key = `blog:engagement:${blogId}:${type}`;
    const currentValue = (await this.cacheManager.get<number>(key)) || 0;
    await this.cacheManager.set(key, currentValue + 1, 3600000); // 1 hour TTL

    // Schedule sync job if not already scheduled
    // Use blogId as jobId to ensure only one sync job per blog is active
    await this.engagementQueue
      .add(
        'sync-engagement',
        { blogId },
        {
          delay: 30000, // 30 seconds
          jobId: `sync:${blogId}`,
          removeOnComplete: true,
        },
      )
      .catch(() => {
        // Ignore errors if job with same ID already exists
      });
  }

  async like(id: string) {
    // We still return the blog, but the count might be slightly stale or we can optimisticly increment
    const blog = await this.blogModel.findById(id).exec();
    if (!blog) {
      throw new NotFoundException(`Blog with ID "${id}" not found`);
    }

    await this.bufferEngagement(id, 'likes');

    // Optimistic return (optional: we can fetch current buffered value to return more accurate count)
    const bufferedLikes =
      (await this.cacheManager.get<number>(`blog:engagement:${id}:likes`)) || 0;
    blog.engagement.likes += 1; // For immediate UI feedback if returned
    return blog;
  }

  async incrementViews(id: string) {
    const blog = await this.blogModel.findById(id).exec();
    if (!blog) return null;

    await this.bufferEngagement(id, 'views');
    return blog;
  }

  async addComment(blogId: string, createCommentDto: CreateCommentDto) {
    const blog = await this.blogModel.findById(blogId).exec();
    if (!blog) {
      throw new NotFoundException(`Blog with ID "${blogId}" not found`);
    }

    const comment = new this.commentModel({
      ...createCommentDto,
      blogId,
      status: 'Pending',
    });

    await comment.save();

    // Buffer the comment count increment
    await this.bufferEngagement(blogId, 'comments');

    return comment;
  }

  async getComments(
    blogId: string,
    query: {
      admin?: boolean;
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { admin = false, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const filter: any = { blogId };
    if (status && status !== 'All') {
      filter.status = status;
    } else if (!admin) {
      filter.status = 'Approved';
    }

    const [data, total] = await Promise.all([
      this.commentModel
        .find(filter)
        .populate('blogId', 'title createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.commentModel.countDocuments(filter).exec(),
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

  async updateCommentStatus(
    commentId: string,
    updateStatusDto: UpdateCommentStatusDto,
  ) {
    const comment = await this.commentModel
      .findByIdAndUpdate(
        commentId,
        { status: updateStatusDto.status },
        { new: true },
      )
      .exec();

    if (!comment) {
      throw new NotFoundException(`Comment with ID "${commentId}" not found`);
    }

    return comment;
  }
}

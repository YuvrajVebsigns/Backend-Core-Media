import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';
import { BlogStatus } from './enums/blog-status.enum';
import { CreateCommentDto } from './dto/comment.dto';

@ApiTags('Website | Blogs')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteAuthGuard)
@Controller('website/blogs')
export class WebsiteBlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all published blogs for this website',
    description:
      'Returns a paginated list of published and active blogs that are associated with the authenticated website.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit items per page',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for titles, slugs, or tags',
  })
  async findAll(
    @CurrentWebsite() website: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.blogsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      isActive: true,
      status: BlogStatus.PUBLISHED,
      websiteId: website.id,
    });
  }

  @Get(':idOrSlug')
  @ApiOperation({
    summary: 'Get a specific published blog by ID or slug',
    description:
      'Fetches details of a specific blog and verifies that it is active, published, and belongs to the authenticated website.',
  })
  @ApiParam({
    name: 'idOrSlug',
    description: 'The MongoDB ID or the URL-friendly slug of the blog',
  })
  async findOne(
    @CurrentWebsite() website: any,
    @Param('idOrSlug') idOrSlug: string,
  ) {
    let blog: any;
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await this.blogsService.findOne(idOrSlug);
    } else {
      blog = await this.blogsService.findBySlug(idOrSlug);
    }

    if (!blog || !blog.isActive || blog.status !== BlogStatus.PUBLISHED) {
      throw new NotFoundException('Blog not found or is not published');
    }

    // Verify it is associated with the authenticated website
    const hasWebsite = blog.websites.some(
      (w: any) =>
        w._id?.toString() === website.id ||
        w.id === website.id ||
        w.toString() === website.id,
    );

    if (!hasWebsite) {
      throw new NotFoundException('Blog not found for this website');
    }

    return blog;
  }

  @Post(':id/like')
  @ApiOperation({
    summary: 'Like a blog post',
    description:
      'Increments the like count for the specified blog. Verifies that the blog belongs to this website.',
  })
  @ApiParam({ name: 'id', description: 'The MongoDB ID of the blog' })
  async like(@CurrentWebsite() website: any, @Param('id') id: string) {
    await this.validateBlogBelongsToWebsite(id, website.id);
    return this.blogsService.like(id);
  }

  @Post(':id/view')
  @ApiOperation({
    summary: 'Track a blog post view',
    description:
      'Increments the view count for the specified blog. Verifies that the blog belongs to this website.',
  })
  @ApiParam({ name: 'id', description: 'The MongoDB ID of the blog' })
  async incrementViews(
    @CurrentWebsite() website: any,
    @Param('id') id: string,
  ) {
    await this.validateBlogBelongsToWebsite(id, website.id);
    return this.blogsService.incrementViews(id);
  }

  @Post(':id/comments')
  @ApiOperation({
    summary: 'Submit a comment to a blog post',
    description:
      'Creates a pending comment on the specified blog post. Verifies that the blog belongs to this website.',
  })
  @ApiParam({ name: 'id', description: 'The MongoDB ID of the blog' })
  async addComment(
    @CurrentWebsite() website: any,
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    await this.validateBlogBelongsToWebsite(id, website.id);
    return this.blogsService.addComment(id, createCommentDto);
  }

  @Get(':id/comments')
  @ApiOperation({
    summary: 'Get approved comments for a blog post',
    description:
      'Fetches the list of approved comments for a specific blog post. Verifies that the blog belongs to this website.',
  })
  @ApiParam({ name: 'id', description: 'The MongoDB ID of the blog' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getComments(
    @CurrentWebsite() website: any,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    await this.validateBlogBelongsToWebsite(id, website.id);
    return this.blogsService.getComments(id, {
      admin: false,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  private async validateBlogBelongsToWebsite(
    blogId: string,
    websiteId: string,
  ) {
    const blog = await this.blogsService.findOne(blogId);
    if (!blog || !blog.isActive || blog.status !== BlogStatus.PUBLISHED) {
      throw new NotFoundException('Blog not found or is not published');
    }

    const hasWebsite = blog.websites.some(
      (w: any) =>
        w._id?.toString() === websiteId ||
        w.id === websiteId ||
        w.toString() === websiteId,
    );

    if (!hasWebsite) {
      throw new NotFoundException('Blog not found for this website');
    }
  }
}

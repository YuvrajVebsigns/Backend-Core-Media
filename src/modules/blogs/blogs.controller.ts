import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto, UpdateBlogDto, QueryBlogDto } from './dto/blog.dto';
import { CreateCommentDto, UpdateCommentStatusDto } from './dto/comment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemUserRole } from '../../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Blogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) { }

  @Post()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new blog' })
  create(@Body() createBlogDto: CreateBlogDto, @Request() req: any) {
    return this.blogsService.create(createBlogDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all blogs with pagination and filters' })
  @ApiQuery({ name: 'showMetadata', required: false, type: Boolean, description: 'Whether to show creation and update timestamps' })
  findAll(@Query() queryDto: QueryBlogDto) {
    return this.blogsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific blog by ID' })
  findOne(@Param('id') id: string) {
    return this.blogsService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Update a blog' })
  update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return this.blogsService.update(id, updateBlogDto);
  }

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a blog (soft delete)' })
  remove(@Param('id') id: string) {
    return this.blogsService.remove(id);
  }

  @Patch(':id/like')
  @ApiOperation({ summary: 'Like a blog' })
  like(@Param('id') id: string) {
    return this.blogsService.like(id);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'Increment blog views' })
  incrementViews(@Param('id') id: string) {
    return this.blogsService.incrementViews(id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a blog' })
  addComment(@Param('id') id: string, @Body() createCommentDto: CreateCommentDto) {
    return this.blogsService.addComment(id, createCommentDto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a blog' })
  @ApiQuery({ name: 'admin', required: false, type: Boolean, description: 'Whether to show all comments including pending ones' })
  @ApiQuery({ name: 'showMetadata', required: false, type: Boolean, description: 'Whether to show creation and update timestamps' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter comments by status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit number of comments per page' })
  getComments(
    @Param('id') id: string,
    @Query('admin') admin: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.blogsService.getComments(id, {
      admin: admin === 'true',
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('comments/:commentId/status')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Update comment status (moderate)' })
  updateCommentStatus(@Param('commentId') commentId: string, @Body() updateStatusDto: UpdateCommentStatusDto) {
    return this.blogsService.updateCommentStatus(commentId, updateStatusDto);
  }
}

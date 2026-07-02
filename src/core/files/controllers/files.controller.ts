import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

import { FilesService } from '@core/files/services/files.service';
import { UploadFileDto } from '@core/files/dto/upload-file.dto';
import { UpdateFileDto } from '@core/files/dto/update-file.dto';
import { QueryFileDto } from '@core/files/dto/query-file.dto';
import { FileResponseDto } from '@core/files/dto/file-response.dto';
import { PaginatedFileResponseDto } from '@core/files/dto/paginated-file-response.dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemUserRole } from '@common/enums/role.enum';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  // ─── POST /admin/files/upload ──────────────────────────────────────────────

  @Post('upload')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB hard cap
    }),
  )
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload with metadata',
    schema: {
      type: 'object',
      required: ['file', 'module', 'entityType', 'entityId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        module: {
          type: 'string',
          enum: [
            'blogs',
            'branding',
            'events',
            'users',
            'websites',
            'documents',
            'reports',
            'teams',
            'media',
          ],
        },
        entityType: { type: 'string', example: 'post' },
        entityId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        visibility: {
          type: 'string',
          enum: ['public', 'private'],
          default: 'public',
        },
        alt: { type: 'string', example: 'Hero banner image' },
        url: { type: 'string', example: 'https://example.com/image.jpg' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: FileResponseDto,
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Request() req: any,
  ) {
    if (!file && !dto.url) {
      throw new BadRequestException(
        'No file or URL provided. Please attach a file or provide an external URL.',
      );
    }
    return this.filesService.upload(file, dto, req.user.id);
  }

  // ─── GET /admin/files ──────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all files with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'List of files',
    type: PaginatedFileResponseDto,
  })
  async findAll(@Query() query: QueryFileDto) {
    return this.filesService.findAll(query);
  }

  // ─── GET /admin/files/:id ──────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata by ID' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the file',
    example: '665abc1234567890abcdef12',
  })
  @ApiResponse({
    status: 200,
    description: 'File record',
    type: FileResponseDto,
  })
  async findOne(@Param('id') id: string) {
    const file = await this.filesService.findById(id);
    return this.filesService.mapToResponse(file);
  }

  // ─── PATCH /admin/files/:id ────────────────────────────────────────────────

  @Patch(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Update file metadata (alt, visibility, entity)' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the file',
    example: '665abc1234567890abcdef12',
  })
  @ApiResponse({
    status: 200,
    description: 'Updated file record',
    type: FileResponseDto,
  })
  async update(@Param('id') id: string, @Body() dto: UpdateFileDto) {
    return this.filesService.update(id, dto);
  }

  // ─── DELETE /admin/files/:id ───────────────────────────────────────────────

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a file (soft-delete + storage cleanup)' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the file',
    example: '665abc1234567890abcdef12',
  })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.filesService.remove(id);
    return { message: 'File deleted successfully' };
  }

  // ─── GET /admin/files/:id/url ──────────────────────────────────────────────

  @Get(':id/url')
  @ApiOperation({ summary: 'Get public CDN URL for a file' })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the file',
    example: '665abc1234567890abcdef12',
  })
  @ApiResponse({
    status: 200,
    description: 'Public CDN URL with variant URLs',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example:
            'https://cdn.coremedia.com/prod/blogs/post/abc123/original/550e8400.webp',
        },
        variants: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  })
  async getUrl(@Param('id') id: string) {
    const file = await this.filesService.findById(id);
    return this.filesService.mapToResponse(file);
  }

  // ─── POST /admin/files/:id/signed-url ──────────────────────────────────────

  @Post(':id/signed-url')
  @ApiOperation({
    summary: 'Generate a time-limited signed URL for a private file',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the file',
    example: '665abc1234567890abcdef12',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        expiresIn: {
          type: 'number',
          description: 'Expiry in seconds (default: 3600)',
          example: 3600,
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Signed URL with expiry',
    schema: {
      type: 'object',
      properties: {
        signedUrl: { type: 'string' },
        expiresIn: { type: 'number' },
      },
    },
  })
  async getSignedUrl(
    @Param('id') id: string,
    @Body('expiresIn') expiresIn?: number,
  ) {
    return this.filesService.getSignedUrl(id, expiresIn);
  }
}

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
} from '@nestjs/swagger';

import { FilesService } from '../services/files.service.js';
import { UploadFileDto } from '../dto/upload-file.dto.js';
import { UpdateFileDto } from '../dto/update-file.dto.js';
import { FileResponseDto } from '../dto/file-response.dto.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { SystemUserRole } from '../../../common/enums/role.enum.js';

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
          enum: ['blogs', 'branding', 'events', 'users', 'websites', 'documents', 'media'],
        },
        entityType: { type: 'string', example: 'post' },
        entityId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        visibility: { type: 'string', enum: ['public', 'private'], default: 'public' },
        alt: { type: 'string', example: 'Hero banner image' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully', type: FileResponseDto })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided. Please attach a file under the "file" field.');
    }
    return this.filesService.upload(file, dto, req.user.id);
  }

  // ─── GET /admin/files/:id ──────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata by ID' })
  @ApiResponse({ status: 200, description: 'File record', type: FileResponseDto })
  async findOne(@Param('id') id: string) {
    return this.filesService.findById(id);
  }

  // ─── PATCH /admin/files/:id ────────────────────────────────────────────────

  @Patch(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Update file metadata (alt, visibility, entity)' })
  @ApiResponse({ status: 200, description: 'Updated file record', type: FileResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateFileDto) {
    return this.filesService.update(id, dto);
  }

  // ─── DELETE /admin/files/:id ───────────────────────────────────────────────

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a file (soft-delete + storage cleanup)' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.filesService.remove(id);
    return { message: 'File deleted successfully' };
  }

  // ─── GET /admin/files/:id/url ──────────────────────────────────────────────

  @Get(':id/url')
  @ApiOperation({ summary: 'Get public CDN URL for a file' })
  @ApiResponse({
    status: 200,
    description: 'Public CDN URL with variant URLs',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://cdn.coremedia.com/prod/blogs/post/abc123/original/550e8400.webp' },
        variants: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  })
  async getUrl(@Param('id') id: string) {
    const file = await this.filesService.findById(id);
    return this.filesService.getUrl(file);
  }

  // ─── POST /admin/files/:id/signed-url ──────────────────────────────────────

  @Post(':id/signed-url')
  @ApiOperation({ summary: 'Generate a time-limited signed URL for a private file' })
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

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileModule } from '../enums/file-module.enum.js';
import { FileVisibility } from '../enums/visibility.enum.js';

/**
 * Validates the multipart form-data fields that accompany the file upload.
 * The actual file binary is handled by Multer's `FileInterceptor`.
 */
export class UploadFileDto {
  @ApiProperty({
    enum: FileModule,
    description: 'CMS module that owns this file',
    example: FileModule.BLOGS,
  })
  @IsEnum(FileModule)
  @IsNotEmpty()
  module: FileModule;

  @ApiProperty({
    description: 'Entity type within the module (e.g. post, logo, banner)',
    example: 'post',
  })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({
    description: 'ID of the owning entity',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiPropertyOptional({
    enum: FileVisibility,
    description: 'Access level for the uploaded file',
    default: FileVisibility.PUBLIC,
  })
  @IsEnum(FileVisibility)
  @IsOptional()
  visibility?: FileVisibility;

  @ApiPropertyOptional({
    description: 'Alt text for images (accessibility / SEO)',
    example: 'Hero banner for the launch blog post',
  })
  @IsString()
  @IsOptional()
  alt?: string;
}

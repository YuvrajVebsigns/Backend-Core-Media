import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FileVisibility } from '@core/files/enums/visibility.enum';
import { FileModule } from '@core/files/enums/file-module.enum';

/**
 * Fields that can be updated after upload.
 * Structural fields (provider, key, mime, size) are immutable.
 */
export class UpdateFileDto {
  @ApiPropertyOptional({
    description: 'Update alt text for images',
    example: 'Updated hero banner alt text',
  })
  @IsString()
  @IsOptional()
  alt?: string;

  @ApiPropertyOptional({
    enum: FileVisibility,
    description: 'Change file access level',
  })
  @IsEnum(FileVisibility)
  @IsOptional()
  visibility?: FileVisibility;

  @ApiPropertyOptional({
    description: 'Re-assign to a different entity type',
    example: 'banner',
  })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Re-assign to a different entity ID',
    example: '507f1f77bcf86cd799439022',
  })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Update keywords for easy searching',
    example: ['modern', 'minimal'],
  })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({
    enum: FileModule,
    description: 'Re-assign file to a different CMS module',
  })
  @IsEnum(FileModule)
  @IsOptional()
  module?: FileModule;
}

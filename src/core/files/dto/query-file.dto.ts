import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FileVisibility } from '@core/files/enums/visibility.enum';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class QueryFileDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by original name or filename' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by module',
    enum: [
      'blogs',
      'branding',
      'events',
      'users',
      'websites',
      'documents',
      'media',
    ],
  })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({
    description: 'Filter by visibility',
    enum: FileVisibility,
  })
  @IsOptional()
  @IsEnum(FileVisibility)
  visibility?: FileVisibility;

  @ApiPropertyOptional({
    description: 'Filter by file type (e.g. image, video, document)',
  })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (ISO string)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO string)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

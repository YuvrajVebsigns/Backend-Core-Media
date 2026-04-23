import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort criteria. Format: field:order (e.g., createdAt:desc, name:asc)', example: 'createdAt:desc' })
  @IsString()
  @IsOptional()
  sort?: string;

  @ApiPropertyOptional({ 
    description: 'JSON stringified filters or standard nested query. Example: {"status":"active"}', 
    example: '{"status":"active"}' 
  })
  @IsOptional()
  @Transform(({ value }) => {
    // If it's a JSON string, safely parse it into an object
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  })
  filters?: Record<string, any>;
}

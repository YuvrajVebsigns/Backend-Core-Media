import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsNumber, IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateNominationCategoryDto {
  @ApiProperty({ example: 'Digital Transformation' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'digital-transformation' })
  @IsString()
  slug: string;

  @ApiProperty({ example: '648c3a4f2f4b9b1d2c9e4f51', description: 'Parent category ID' })
  @IsMongoId()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 0, required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateNominationCategoryDto {
  @ApiProperty({ example: 'Digital Transformation', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'digital-transformation', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: '648c3a4f2f4b9b1d2c9e4f51', description: 'Parent category ID', required: false })
  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class QueryNominationCategoryDto {
  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, description: 'Filter subcategories by parent category ID' })
  @IsMongoId()
  @IsOptional()
  categoryId?: string;
}

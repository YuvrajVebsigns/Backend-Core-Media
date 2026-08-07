import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateNominationCategoryDto {
  @ApiProperty({ example: 'Digital Transformation' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'digital-transformation' })
  @IsString()
  slug: string;

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
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isActive?: boolean;
}

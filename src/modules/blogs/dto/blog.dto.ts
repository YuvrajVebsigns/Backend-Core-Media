import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsEnum, IsMongoId, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class BlogSeoDto {
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @IsString()
  @IsOptional()
  ogImage?: string;
}

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsNotEmpty()
  content: any;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  featureImage?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  websites: string[];

  @IsMongoId()
  @IsOptional()
  author?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BlogSeoDto)
  seo?: BlogSeoDto;
}

export class UpdateBlogDto extends PartialType(CreateBlogDto) {}

export class QueryBlogDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsMongoId()
  websiteId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  sort?: string;
}

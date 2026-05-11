import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsEnum, IsMongoId, ValidateNested, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { BlogStatus } from '../enums/blog-status.enum';
import { AutoArchiveDuration } from '../enums/auto-archive-duration.enum';
import { CommentStrategy } from '../enums/comment-strategy.enum';

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

  @IsMongoId()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined || value === 'null') return null;
    if (typeof value === 'string' && value.startsWith('http')) return null;
    if (typeof value === 'object') return value._id?.toString() || value.id?.toString() || value;
    return value;
  })
  ogImageId?: string;
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

  @IsMongoId()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined || value === 'null') return null;
    if (typeof value === 'string' && value.startsWith('http')) return null;
    if (typeof value === 'object') return value._id?.toString() || value.id?.toString() || value;
    return value;
  })
  featureImageId?: string;

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

  @IsEnum(BlogStatus)
  @IsOptional()
  status?: BlogStatus;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  scheduledAt?: Date;

  @IsEnum(AutoArchiveDuration)
  @IsOptional()
  autoArchiveDuration?: AutoArchiveDuration;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(CommentStrategy)
  @IsOptional()
  commentStrategy?: CommentStrategy;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  invitedEmails?: string[];

  @IsBoolean()
  @IsOptional()
  isHyperlinked?: boolean;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  hyperlinkWebsites?: string[];

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

  @IsEnum(BlogStatus)
  @IsOptional()
  status?: BlogStatus;

  @IsOptional()
  @IsString()
  sort?: string;
}

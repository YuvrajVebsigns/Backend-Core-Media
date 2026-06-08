import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsMongoId,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { BlogStatus } from '@modules/blogs/enums/blog-status.enum';
import { AutoArchiveDuration } from '@modules/blogs/enums/auto-archive-duration.enum';
import { CommentStrategy } from '@modules/blogs/enums/comment-strategy.enum';
import { ImageLinksDto } from '@common/dto/image-links.dto';

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

  @ApiPropertyOptional({ type: () => ImageLinksDto, description: 'Image links object' })
  @IsOptional()
  ogImage?: ImageLinksDto;

  @IsMongoId()
  @IsOptional()
  @Transform(({ value }) => {
    if (
      value === '' ||
      value === null ||
      value === undefined ||
      value === 'null'
    )
      return null;
    if (typeof value === 'string' && value.startsWith('http')) return null;
    if (typeof value === 'object')
      return value._id?.toString() || value.id?.toString() || value;
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

  @ApiPropertyOptional({ type: () => ImageLinksDto, description: 'Image links object' })
  @IsOptional()
  featureImage?: ImageLinksDto;

  @IsMongoId()
  @IsOptional()
  @Transform(({ value }) => {
    if (
      value === '' ||
      value === null ||
      value === undefined ||
      value === 'null'
    )
      return null;
    if (typeof value === 'string' && value.startsWith('http')) return null;
    if (typeof value === 'object')
      return value._id?.toString() || value.id?.toString() || value;
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

export class QueryBlogDto extends PaginationQueryDto {
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
}

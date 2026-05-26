import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsMongoId,
  ValidateNested,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PageType } from '../enums/page-type.enum';
import { PageStatus } from '../enums/page-status.enum';
import { SectionType } from '../enums/section-type.enum';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class PageSectionDto {
  @ApiProperty({ enum: SectionType })
  @IsEnum(SectionType)
  type: SectionType;

  @ApiProperty({ example: 1 })
  @IsNumber()
  order: number;

  @ApiProperty({ type: Object, default: {} })
  @IsNotEmpty()
  data: Record<string, any>;
}

export class SeoMetaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  robots?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ogTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ogDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  ogImageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  twitterTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  twitterDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  twitterImageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  schemaMarkup?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  noIndex?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  noFollow?: boolean;
}

export class CreatePageDto {
  @ApiProperty({ example: '6448... (Website ID)' })
  @IsMongoId()
  @IsNotEmpty()
  siteId: string;

  @ApiProperty({ example: 'About Us' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'about-us' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Brief description of the page' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  content?: any;

  @ApiPropertyOptional({ enum: PageType, default: PageType.STATIC_PAGE })
  @IsEnum(PageType)
  @IsOptional()
  pageType?: PageType;

  @ApiPropertyOptional({ enum: PageStatus, default: PageStatus.DRAFT })
  @IsEnum(PageStatus)
  @IsOptional()
  status?: PageStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  featuredImageId?: string;

  @ApiPropertyOptional({ type: [PageSectionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageSectionDto)
  sections?: PageSectionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  navbarId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isHomepage?: boolean;

  @ApiPropertyOptional({ type: SeoMetaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeoMetaDto)
  seo?: SeoMetaDto;
}

export class QueryPageDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '6448... (Website ID)' })
  @IsOptional()
  @IsMongoId()
  siteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PageStatus })
  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;

  @ApiPropertyOptional({ enum: PageType })
  @IsOptional()
  @IsEnum(PageType)
  pageType?: PageType;
}

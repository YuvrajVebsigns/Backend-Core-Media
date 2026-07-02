import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ImageLinksDto } from '@common/dto/image-links.dto';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

class SeoMetadataDto {
  @ApiPropertyOptional({ example: 'My Awesome Website' })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({ example: 'The best place for media content' })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ example: ['media', 'news', 'blogs'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @ApiPropertyOptional({
    type: () => ImageLinksDto,
    description: 'Image links object',
  })
  @IsOptional()
  ogImage?: ImageLinksDto;

  @ApiPropertyOptional({ example: '665abc1234567890abcdef12' })
  @IsOptional()
  @IsString()
  ogImageId?: string;
}

export class CreateWebsiteDto {
  @ApiProperty({ example: 'Main Website' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'main-website' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({ example: 'https://example.com' })
  @IsNotEmpty()
  @IsString()
  domain: string;

  @ApiPropertyOptional({
    type: () => ImageLinksDto,
    description: 'Image links object',
  })
  @IsOptional()
  logo?: ImageLinksDto;

  @ApiPropertyOptional({ example: '665abc1234567890abcdef12' })
  @IsOptional()
  @IsString()
  logoId?: string;

  @ApiPropertyOptional({ example: 'A brief description of the website' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: { primaryColor: '#ff0000' } })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ type: SeoMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeoMetadataDto)
  seo?: SeoMetadataDto;

  @ApiPropertyOptional({
    example: [
      'website.uatcoremedia.vebsigns.com',
      'staging.coremediagroup.com',
    ],
    description:
      'Additional (whitelabel / staging / UAT) domains that are allowed to obtain a token for this website.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];
}

export class UpdateWebsiteDto extends PartialType(CreateWebsiteDto) {}

export class QueryWebsiteDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}

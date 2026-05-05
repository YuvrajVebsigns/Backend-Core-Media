import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

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

  @ApiPropertyOptional({ example: 'https://example.com/og-image.png' })
  @IsOptional()
  @IsString()
  ogImage?: string;
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

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;

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
}

export class UpdateWebsiteDto extends PartialType(CreateWebsiteDto) {}

export class QueryWebsiteDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}

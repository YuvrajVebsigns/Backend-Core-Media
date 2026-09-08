import {
  IsString,
  IsOptional,
  IsBoolean,
  IsMongoId,
  IsEnum,
  IsEmail,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { ImageLinksDto } from '@common/dto/image-links.dto';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { SponsorType, SponsorTier } from '../schemas/sponsor.schema';
import {
  toTitleCase,
  cleanEmail,
  cleanPhone,
  cleanWhitespace,
} from '@common/utils/string.util';

export class SocialLinksDto {
  @IsString()
  @IsOptional()
  linkedin?: string;

  @IsString()
  @IsOptional()
  twitter?: string;

  @IsString()
  @IsOptional()
  facebook?: string;

  @IsString()
  @IsOptional()
  instagram?: string;
}

export class AddressDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => cleanWhitespace(value))
  street?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => toTitleCase(value))
  city?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => toTitleCase(value))
  state?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => toTitleCase(value))
  country?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => cleanWhitespace(value))
  zip?: string;
}

export class CreateSponsorDto {
  @ApiProperty({ example: 'John Doe' })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Tech Corp' })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ example: 'techcorp.com' })
  @IsString()
  @IsOptional()
  companyDomain?: string;

  @ApiPropertyOptional({ example: 'john@techcorp.com' })
  @Transform(({ value }) => cleanEmail(value))
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-0123' })
  @Transform(({ value }) => cleanPhone(value))
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'CEO' })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiPropertyOptional({
    type: () => ImageLinksDto,
    description: 'Logo image links object',
  })
  @IsOptional()
  logo?: ImageLinksDto;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
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
  logoId?: string;

  @ApiPropertyOptional({ example: 'https://techcorp.com' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ example: '$1B' })
  @IsString()
  @IsOptional()
  valuation?: string;

  @ApiPropertyOptional({ enum: SponsorType, example: SponsorType.COMPANY })
  @IsEnum(SponsorType)
  @IsOptional()
  type?: SponsorType;

  @ApiPropertyOptional({ enum: SponsorTier, example: SponsorTier.GOLD })
  @IsEnum(SponsorTier)
  @IsOptional()
  tier?: SponsorTier;

  @ApiPropertyOptional({ example: 'A leading tech company' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: () => SocialLinksDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @ApiPropertyOptional({ type: () => AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  websites?: string[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateSponsorDto extends PartialType(CreateSponsorDto) {}

export class QuerySponsorDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, company, or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SponsorType })
  @IsOptional()
  @IsEnum(SponsorType)
  type?: SponsorType;

  @ApiPropertyOptional({ enum: SponsorTier })
  @IsOptional()
  @IsEnum(SponsorTier)
  tier?: SponsorTier;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  websiteId?: string;
}

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ImageLinksDto } from '@common/dto/image-links.dto';

export class CreateSponsorDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Tech Corp' })
  @IsString()
  companyName: string;

  @ApiProperty({ example: 'techcorp.com', required: false })
  @IsString()
  @IsOptional()
  companyDomain?: string;

  @ApiProperty({ example: '$1B', required: false })
  @IsString()
  @IsOptional()
  valuation?: string;

  @ApiPropertyOptional({ type: () => ImageLinksDto, description: 'Image links object' })
  @IsOptional()
  logo?: ImageLinksDto;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', required: false })
  @IsMongoId()
  @IsOptional()
  logoId?: string;

  @ApiProperty({ example: 'https://techcorp.com', required: false })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({ example: 'Gold' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 'A leading tech company' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSponsorDto extends PartialType(CreateSponsorDto) {}

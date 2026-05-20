import { IsString, IsOptional, IsBoolean, IsUrl, IsMongoId } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

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

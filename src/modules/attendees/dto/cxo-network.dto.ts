import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  toTitleCase,
  cleanEmail,
  cleanPhone,
  cleanWhitespace,
} from '@common/utils/string.util';

export class CreateCxoNetworkMemberDto {
  @ApiProperty({ example: 'John', required: true })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', required: true })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Mr.', required: false })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Chief Information Officer', required: true })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  @IsNotEmpty()
  currentDesignation: string;

  @ApiProperty({ example: 'john.doe@company.com', required: true })
  @Transform(({ value }) => cleanEmail(value))
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1 555 123 4567', required: false })
  @Transform(({ value }) => cleanPhone(value))
  @IsString()
  @IsOptional()
  telephoneNo?: string;

  @ApiProperty({ example: '+1 555 987 6543', required: false })
  @Transform(({ value }) => cleanPhone(value))
  @IsString()
  @IsOptional()
  cioMobilePhone?: string;

  @ApiProperty({ example: 'https://linkedin.com/in/johndoe', required: false })
  @Transform(({ value }) => cleanWhitespace(value))
  @IsString()
  @IsOptional()
  linkedInLink?: string;

  @ApiProperty({ example: 'Acme Enterprises', required: true })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: '123 Tech Park, Financial District', required: false })
  @Transform(({ value }) => cleanWhitespace(value))
  @IsString()
  @IsOptional()
  companyAddress?: string;

  @ApiProperty({ example: 'New York', required: false })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'NY', required: false })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '10001', required: false })
  @Transform(({ value }) => cleanWhitespace(value))
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: 'USA', required: false })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    example: 'Enterprise',
    enum: ['Enterprise', 'Startup', 'Government', 'Education', 'Other'],
    required: false,
  })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  @IsOptional()
  companyCategory?: string;

  @ApiProperty({ example: 'Financial Services', required: false })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  @IsOptional()
  businessVertical?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', required: false })
  @IsString()
  @IsOptional()
  websiteId?: string;
}

export class QueryCxoNetworkDto {
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
  @IsString()
  @IsOptional()
  companyCategory?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  websiteId?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  IsNotEmpty,
} from 'class-validator';

export class CreateCxoNetworkMemberDto {
  @ApiProperty({ example: 'John', required: true })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', required: true })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Mr.', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Chief Information Officer', required: true })
  @IsString()
  @IsNotEmpty()
  currentDesignation: string;

  @ApiProperty({ example: 'john.doe@company.com', required: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1 555 123 4567', required: false })
  @IsString()
  @IsOptional()
  telephoneNo?: string;

  @ApiProperty({ example: '+1 555 987 6543', required: false })
  @IsString()
  @IsOptional()
  cioMobilePhone?: string;

  @ApiProperty({ example: 'https://linkedin.com/in/johndoe', required: false })
  @IsString()
  @IsOptional()
  linkedInLink?: string;

  @ApiProperty({ example: 'Acme Enterprises', required: true })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: '123 Tech Park, Financial District', required: false })
  @IsString()
  @IsOptional()
  companyAddress?: string;

  @ApiProperty({ example: 'New York', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'NY', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '10001', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: 'USA', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    example: 'Enterprise',
    enum: ['Enterprise', 'Startup', 'Government', 'Education', 'Other'],
    required: false,
  })
  @IsString()
  @IsOptional()
  companyCategory?: string;

  @ApiProperty({ example: 'Financial Services', required: false })
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

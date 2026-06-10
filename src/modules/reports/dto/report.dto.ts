import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsEmail,
} from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ example: 'CIO Outlook Survey 2021', description: 'Title of the report' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'cio-outlook-survey-2021', description: 'URL friendly slug' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'This is the description of the CIO survey report', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '665abc1234567890abcdef12', description: 'File document ID' })
  @IsMongoId()
  @IsNotEmpty()
  fileId: string;

  @ApiProperty({ example: '665abc1234567890abcdef13', required: false, description: 'Website scope ID' })
  @IsMongoId()
  @IsOptional()
  websiteId?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class UpdateReportDto {
  @ApiProperty({ example: 'CIO Outlook Survey 2021', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'cio-outlook-survey-2021', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '665abc1234567890abcdef12', required: false })
  @IsMongoId()
  @IsOptional()
  fileId?: string;

  @ApiProperty({ example: '665abc1234567890abcdef13', required: false })
  @IsMongoId()
  @IsOptional()
  websiteId?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class QueryReportDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false, description: 'Search reports by title or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false, description: 'Filter by website ID' })
  @IsMongoId()
  @IsOptional()
  websiteId?: string;

  @ApiProperty({ required: false, description: 'Filter by publish status' })
  @IsOptional()
  isPublished?: string; // String type because query params are parsed as strings initially
}

export class DownloadReportDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'User email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '9876543210', description: 'User mobile number without country code' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: '+91', description: 'User mobile country code' })
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty({ example: 'Acme Corporation', description: 'User company name' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: 'CIO', description: 'User job designation' })
  @IsString()
  @IsNotEmpty()
  designation: string;

  @ApiProperty({ example: 'Information Technology', description: 'User industry category' })
  @IsString()
  @IsNotEmpty()
  industry: string;

  @ApiProperty({ example: '665abc1234567890abcdef12', description: 'ID of the report to download' })
  @IsMongoId()
  @IsNotEmpty()
  reportId: string;
}

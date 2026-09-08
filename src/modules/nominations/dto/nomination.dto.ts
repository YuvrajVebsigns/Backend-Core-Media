import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsMongoId,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { NominationStatus } from '../schemas/nomination.schema';
import {
  toTitleCase,
  cleanEmail,
  cleanPhone,
} from '@common/utils/string.util';

/**
 * DTO for a single nominee in the form submission
 */
export class NomineeDto {
  @ApiProperty({
    example: '60d5ecb8b392d7001f3e3a4b',
    description: 'CIO nomination category ID',
  })
  @IsMongoId()
  categoryId!: string;

  @ApiProperty({
    example: '60d5ecb8b392d7001f3e3a4c',
    description: 'CIO nomination sub category ID',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  subCategoryId?: string;

  @ApiProperty({
    example: '60d5ecb8b392d7001f3e3a4c',
    description: 'CIO nomination sub category ID (alternative casing)',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  subcategoryId?: string;

  @ApiProperty({ example: 'Jane Smith', description: 'CIO Contact Name' })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  contactName!: string;

  @ApiProperty({ example: 'Infosys', description: 'CIO Company Name' })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  companyName!: string;

  @ApiProperty({
    example: 'jane@infosys.com',
    description: 'CIO Contact Email',
  })
  @Transform(({ value }) => cleanEmail(value))
  @IsEmail()
  contactEmail!: string;

  @ApiProperty({
    example: '9876543210',
    required: false,
    description: 'CIO Mobile No',
  })
  @Transform(({ value }) => cleanPhone(value))
  @IsString()
  @IsOptional()
  mobileNo?: string;
}

/**
 * DTO for website form submission — nominator submits their details + up to 10 nominees in a single request
 */
export class CreateNominationDto {
  // Nominator details
  @ApiProperty({ example: 'John Doe', description: 'Name of the Nominator' })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  nominatorName!: string;

  @ApiProperty({
    example: 'Acme Corp',
    description: "Name of the Nominator's Company",
  })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  nominatorCompany!: string;

  @ApiProperty({ example: 'Mumbai', description: 'Nominator City' })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  nominatorCity!: string;

  @ApiProperty({
    example: '9876543210',
    required: false,
    description: 'Nominator Contact No',
  })
  @Transform(({ value }) => cleanPhone(value))
  @IsString()
  @IsOptional()
  nominatorPhone?: string;

  @ApiProperty({ example: 'john@acme.com', description: 'Nominator Email ID' })
  @Transform(({ value }) => cleanEmail(value))
  @IsEmail()
  nominatorEmail!: string;

  // Nominees (1 to 10 per request)
  @ApiProperty({
    type: [NomineeDto],
    description: 'CIO nominations (up to 10 in a single request)',
    minItems: 1,
    maxItems: 10,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @Type(() => NomineeDto)
  nominees!: NomineeDto[];
}

/**
 * DTO for admin update of nomination
 */
export class UpdateNominationDto {
  @ApiProperty({ enum: NominationStatus, required: false })
  @IsEnum(NominationStatus)
  @IsOptional()
  status?: NominationStatus;
}

/**
 * DTO for admin status change
 */
export class UpdateNominationStatusDto {
  @ApiProperty({ enum: NominationStatus })
  @IsEnum(NominationStatus)
  status: NominationStatus;
}

export class UpdateWebsiteNominationStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}

/**
 * DTO for querying nominations with pagination and filters
 */
export class QueryNominationDto {
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

  @ApiProperty({ enum: NominationStatus, required: false })
  @IsEnum(NominationStatus)
  @IsOptional()
  status?: NominationStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  websiteId?: string;

  @ApiProperty({ required: false, description: 'Filter by nominator email' })
  @IsString()
  @IsOptional()
  nominatorEmail?: string;

  @ApiProperty({ required: false, description: 'Filter by nominator ID' })
  @IsMongoId()
  @IsOptional()
  nominatorId?: string;

  @ApiProperty({ required: false, description: 'Filter by nominee ID' })
  @IsMongoId()
  @IsOptional()
  nomineeId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by start date (ISO string or YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by end date (ISO string or YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  endDate?: string;
}

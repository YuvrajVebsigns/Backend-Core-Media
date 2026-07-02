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
} from 'class-validator';
import { Type } from 'class-transformer';
import { NominationStatus } from '../schemas/nomination.schema';

/**
 * DTO for a single nominee in the form submission
 */
export class NomineeDto {
  @ApiProperty({
    example: '60d5ecb8b392d7001f3e3a4b',
    description: 'CIO nomination category ID',
  })
  @IsMongoId()
  categoryId: string;

  @ApiProperty({ example: 'Jane Smith', description: 'CIO Contact Name' })
  @IsString()
  contactName: string;

  @ApiProperty({ example: 'Infosys', description: 'CIO Company Name' })
  @IsString()
  companyName: string;

  @ApiProperty({
    example: 'jane@infosys.com',
    description: 'CIO Contact Email',
  })
  @IsEmail()
  contactEmail: string;

  @ApiProperty({
    example: '9876543210',
    required: false,
    description: 'CIO Mobile No',
  })
  @IsString()
  @IsOptional()
  mobileNo?: string;
}

/**
 * DTO for website form submission — nominator submits their details + up to 10 nominees
 */
export class CreateNominationDto {
  // Nominator details
  @ApiProperty({ example: 'John Doe', description: 'Name of the Nominator' })
  @IsString()
  nominatorName: string;

  @ApiProperty({
    example: 'Acme Corp',
    description: "Name of the Nominator's Company",
  })
  @IsString()
  nominatorCompany: string;

  @ApiProperty({ example: 'Mumbai', description: 'Nominator City' })
  @IsString()
  nominatorCity: string;

  @ApiProperty({
    example: '9876543210',
    required: false,
    description: 'Nominator Contact No',
  })
  @IsString()
  @IsOptional()
  nominatorPhone?: string;

  @ApiProperty({ example: 'john@acme.com', description: 'Nominator Email ID' })
  @IsEmail()
  nominatorEmail: string;

  // Nominees (1 to 10)
  @ApiProperty({
    type: [NomineeDto],
    description: 'CIO nominations (up to 10)',
    minItems: 1,
    maxItems: 10,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @Type(() => NomineeDto)
  nominees: NomineeDto[];
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
}

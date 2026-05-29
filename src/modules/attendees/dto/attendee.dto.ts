import {
  IsString,
  IsEmail,
  IsOptional,
  IsMongoId,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AttendeeStatus } from '@modules/attendees/schemas/attendee.schema';

export class RegisterAttendeeDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  eventId: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Acme Corp', required: false })
  @IsString()
  @IsOptional()
  organization?: string;
}

export class UpdateAttendeeStatusDto {
  @ApiProperty({ enum: AttendeeStatus })
  @IsEnum(AttendeeStatus)
  status: AttendeeStatus;
}

export class CreateAttendeeDto extends RegisterAttendeeDto {
  @ApiProperty({ enum: AttendeeStatus, required: false })
  @IsEnum(AttendeeStatus)
  @IsOptional()
  status?: AttendeeStatus;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', required: false })
  @IsMongoId()
  @IsOptional()
  websiteId?: string;
}

export class UpdateAttendeeDto {
  @ApiProperty({ enum: AttendeeStatus, required: false })
  @IsEnum(AttendeeStatus)
  @IsOptional()
  status?: AttendeeStatus;

  @ApiProperty({ example: 'Acme Corp', required: false })
  @IsString()
  @IsOptional()
  organization?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', required: false })
  @IsMongoId()
  @IsOptional()
  eventId?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', required: false })
  @IsMongoId()
  @IsOptional()
  websiteId?: string;
}

export class QueryAttendeeDto {
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

  @ApiProperty({ enum: AttendeeStatus, required: false })
  @IsEnum(AttendeeStatus)
  @IsOptional()
  status?: AttendeeStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  eventId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  websiteId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  email?: string;
}

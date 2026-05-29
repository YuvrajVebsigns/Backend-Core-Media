import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsMongoId } from 'class-validator';

export class UpdateRegistreeDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Acme Corp', required: false })
  @IsString()
  @IsOptional()
  organization?: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', required: false })
  @IsMongoId()
  @IsOptional()
  websiteId?: string;
}

export class QueryRegistreeDto {
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
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  eventId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  websiteId?: string;
}

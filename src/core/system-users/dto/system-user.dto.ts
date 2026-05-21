import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RoleResponseDto } from '@core/roles/dto/role.dto';

export class CreateSystemUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: '6448... (Role ObjectId)',
    description: 'ID of the role',
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  acceptTerms?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSystemUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: 'NewPassword123!' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: '6448... (Role ObjectId)' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isActive?: boolean;
}

export class SystemUserResponseDto {
  @ApiProperty({ example: '6448...' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ type: RoleResponseDto })
  role: RoleResponseDto;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: true })
  acceptTerms: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  profileImage?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  lastLogin?: Date;
}

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class QuerySystemUserDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by role ID' })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

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

  @ApiProperty({ example: '6448... (Role ObjectId)', description: 'ID of the role' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  acceptTerms?: boolean;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  profileImage?: string;
}

export class UpdateSystemUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '6448... (Role ObjectId)' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

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

  @ApiProperty()
  role: any;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: true })
  acceptTerms: boolean;

  @ApiPropertyOptional({ example: '1234567890' })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  profileImage?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  lastLogin?: Date;
}

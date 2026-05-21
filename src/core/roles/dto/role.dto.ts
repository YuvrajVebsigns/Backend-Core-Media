import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'EDITOR' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'editor' })
  @IsString()
  @IsNotEmpty()
  roleKey: string;

  @ApiProperty({ example: ['view_posts', 'edit_posts'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isShow?: boolean;
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'MODERATOR' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'moderator' })
  @IsOptional()
  @IsString()
  roleKey?: string;

  @ApiPropertyOptional({ example: ['view_posts'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isShow?: boolean;
}

export class RoleResponseDto {
  @ApiProperty({ example: '6448...' })
  id: string;

  @ApiProperty({ example: 'ADMIN' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  roleKey: string;

  @ApiProperty({ example: ['*'] })
  permissions: string[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: true })
  isShow: boolean;
}

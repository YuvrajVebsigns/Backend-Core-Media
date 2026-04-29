import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, IsMongoId } from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({ example: 'Dashboard' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '/dashboard' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiPropertyOptional({ example: '60d5ecb3ed1e462a5c8e3e4a' })
  @IsOptional()
  @IsMongoId()
  parentId?: string;

  @ApiProperty({ example: 'dashboard.view' })
  @IsString()
  @IsNotEmpty()
  permissionKey: string;

  @ApiPropertyOptional({ example: 'home' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ example: 'MENU' })
  @IsOptional()
  @IsString()
  group?: string;
}

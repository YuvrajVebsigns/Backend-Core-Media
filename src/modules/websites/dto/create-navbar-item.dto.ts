import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MenuType } from '../enums/menu-type.enum';
import { NavbarPosition } from '../enums/navbar-position.enum';

export class MenuItemDto {
  @ApiProperty({ example: 'Home' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '/' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ enum: MenuType, default: MenuType.INTERNAL_PAGE })
  @IsEnum(MenuType)
  menuType: MenuType;

  @ApiPropertyOptional({ example: '_blank' })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  pageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateNavbarItemDto {
  @ApiProperty({ example: '6448... (Website ID)' })
  @IsMongoId()
  @IsNotEmpty()
  siteId: string;

  @ApiProperty({ example: 'Primary Navbar' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ enum: NavbarPosition, default: NavbarPosition.HEADER })
  @IsEnum(NavbarPosition)
  @IsOptional()
  position?: NavbarPosition;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  parentId?: string;

  @ApiPropertyOptional({ type: [MenuItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemDto)
  items?: MenuItemDto[];
}

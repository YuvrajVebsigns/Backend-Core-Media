import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class NavbarOrderDto {
  @ApiProperty({ example: '6448... (Navbar ID)' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  order: number;
}

export class ReorderNavbarDto {
  @ApiPropertyOptional({ example: '6448... (Website ID)' })
  @IsString()
  @IsOptional()
  siteId?: string;

  @ApiPropertyOptional({ example: 'HEADER' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({ type: [NavbarOrderDto] })
  @IsArray()
  @IsNotEmpty()
  @Type(() => NavbarOrderDto)
  orders: NavbarOrderDto[];
}


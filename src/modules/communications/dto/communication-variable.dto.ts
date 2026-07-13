import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { VariableCategoryGroup } from '../schemas/communication-variable.schema';

export class CreateCommunicationVariableDto {
  @ApiProperty({
    example: 'Registree Name',
    description: 'Friendly display name for the variable',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'registreeName',
    description: 'Actual template variable path or key',
  })
  @IsNotEmpty()
  @IsString()
  path: string;

  @ApiPropertyOptional({
    example: 'String',
    description: 'Data type of the variable',
    default: 'String',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'True if variable is an array',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isArray?: boolean;

  @ApiProperty({
    example: 'Registree',
    description: 'Associated base database schema name',
  })
  @IsNotEmpty()
  @IsString()
  modelName: string;

  @ApiProperty({
    enum: VariableCategoryGroup,
    example: VariableCategoryGroup.REGISTRATION,
    description: 'Category group classification',
  })
  @IsNotEmpty()
  @IsEnum(VariableCategoryGroup)
  categoryGroup: VariableCategoryGroup;

  @ApiPropertyOptional({
    example: 'Full name of the registrant',
    description: 'Optional description of the variable content',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Event',
    description: 'Referenced collection schema name if relation field',
  })
  @IsOptional()
  @IsString()
  ref?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'True if compatible as sender/recipient address mapping',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isSenderVariable?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Toggle for enabling/disabling the variable',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCommunicationVariableDto extends PartialType(
  CreateCommunicationVariableDto,
) {}

export class QueryCommunicationVariableDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by term in name, path, or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by modelName base schema' })
  @IsOptional()
  @IsString()
  modelName?: string;

  @ApiPropertyOptional({
    enum: VariableCategoryGroup,
    description: 'Filter by categoryGroup',
  })
  @IsOptional()
  @IsEnum(VariableCategoryGroup)
  categoryGroup?: VariableCategoryGroup;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by sender/recipient address compatibility',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isSenderVariable?: boolean;
}

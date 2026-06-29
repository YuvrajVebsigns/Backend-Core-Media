import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventTemplateMappingDto {
  @ApiProperty({ example: 'user.created', description: 'Dynamic system event key' })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiProperty({ example: '6a3aef188058928cae760d43', description: 'Mapped template ID' })
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateEventTemplateMappingDto {
  @ApiProperty({ example: 'user.created', required: false, description: 'Dynamic system event key' })
  @IsString()
  @IsOptional()
  event?: string;

  @ApiProperty({ example: '6a3aef188058928cae760d43', required: false, description: 'Mapped template ID' })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

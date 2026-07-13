import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunicationChannel } from '../schemas/communication-log.schema';

export class EventMappingTriggerDto {
  @ApiProperty({
    enum: CommunicationChannel,
    example: CommunicationChannel.EMAIL,
    description: 'Channel type for the trigger',
  })
  @IsEnum(CommunicationChannel)
  @IsNotEmpty()
  channel: CommunicationChannel;

  @ApiProperty({
    example: '6a3aef188058928cae760d43',
    description: 'Mapped template ID',
  })
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({
    example: 'nominatorId.email',
    description:
      'Selected recipient database path (dropdown selected) or phone number field',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    example: 'admin@example.com',
    required: false,
    description: 'CC email or expression',
  })
  @IsString()
  @IsOptional()
  cc?: string;

  @ApiProperty({
    example: 'archive@example.com',
    required: false,
    description: 'BCC email or expression',
  })
  @IsString()
  @IsOptional()
  bcc?: string;

  @ApiProperty({ example: 'sender@example.com', required: false })
  @IsString()
  @IsOptional()
  senderEmail?: string;

  @ApiProperty({ example: 'Sender Name', required: false })
  @IsString()
  @IsOptional()
  senderName?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateEventTemplateMappingDto {
  @ApiProperty({
    example: 'user.created',
    description: 'Dynamic system event key',
  })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiProperty({
    type: [EventMappingTriggerDto],
    description: 'Array of message triggers linked to this system event',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EventMappingTriggerDto)
  triggers?: EventMappingTriggerDto[];

  // Legacy fields kept for backward compatibility (all optional)
  @ApiPropertyOptional({
    example: '6a3aef188058928cae760d43',
    description: 'Mapped template ID',
  })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({
    example: '{{email}}',
    description: 'Target recipient(s) expression or static email address(es)',
  })
  @IsString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({
    example: '{{nomineeEmails}}, admin@example.com',
    required: false,
    description: 'CC emails or expressions',
  })
  @IsString()
  @IsOptional()
  cc?: string;

  @ApiPropertyOptional({
    example: 'archive@example.com',
    required: false,
    description: 'BCC emails or expressions',
  })
  @IsString()
  @IsOptional()
  bcc?: string;

  @ApiPropertyOptional({ example: 'sender@example.com', required: false })
  @IsString()
  @IsOptional()
  senderEmail?: string;

  @ApiPropertyOptional({ example: 'Sender Name', required: false })
  @IsString()
  @IsOptional()
  senderName?: string;

  @ApiPropertyOptional({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateEventTemplateMappingDto {
  @ApiPropertyOptional({
    example: 'user.created',
    description: 'Dynamic system event key',
  })
  @IsString()
  @IsOptional()
  event?: string;

  @ApiPropertyOptional({
    type: [EventMappingTriggerDto],
    description: 'Array of message triggers linked to this system event',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EventMappingTriggerDto)
  triggers?: EventMappingTriggerDto[];

  @ApiPropertyOptional({
    example: '6a3aef188058928cae760d43',
    description: 'Mapped template ID',
  })
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional({
    example: '{{email}}',
    description: 'Target recipient(s) expression or static email address(es)',
  })
  @IsString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({
    example: '{{nomineeEmails}}, admin@example.com',
    required: false,
    description: 'CC emails or expressions',
  })
  @IsString()
  @IsOptional()
  cc?: string;

  @ApiPropertyOptional({
    example: 'archive@example.com',
    required: false,
    description: 'BCC emails or expressions',
  })
  @IsString()
  @IsOptional()
  bcc?: string;

  @ApiPropertyOptional({ example: 'sender@example.com', required: false })
  @IsString()
  @IsOptional()
  senderEmail?: string;

  @ApiPropertyOptional({ example: 'Sender Name', required: false })
  @IsString()
  @IsOptional()
  senderName?: string;

  @ApiPropertyOptional({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

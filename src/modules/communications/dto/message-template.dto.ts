import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { CommunicationChannel } from '../schemas/communication-log.schema';

export class CreateMessageTemplateDto {
  @ApiProperty({
    example: 'Welcome Email',
    description: 'Internal template name',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'welcome-email',
    description: 'Unique slug/ID to reference this template',
  })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({
    enum: CommunicationChannel,
    example: CommunicationChannel.EMAIL,
  })
  @IsNotEmpty()
  @IsEnum(CommunicationChannel)
  channel: CommunicationChannel;

  @ApiProperty({
    example: 'Welcome to Core Media, {{name}}!',
    description: 'Email subject line',
  })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({
    example: '<h1>Hello {{name}}</h1><p>Welcome to our network...</p>',
    description: 'HTML layout content',
  })
  @IsNotEmpty()
  @IsString()
  htmlContent: string;

  @ApiPropertyOptional({
    example: 'Hello {{name}}, Welcome to Core Media...',
    description: 'Fallback text version',
  })
  @IsOptional()
  @IsString()
  textContent?: string;

  @ApiPropertyOptional({
    example: ['name', 'verifyUrl'],
    description: 'Expected variables within template body',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

  @ApiPropertyOptional({
    example: 'support@example.com',
    description: 'Template-specific override sender email',
  })
  @IsString()
  @IsOptional()
  senderEmail?: string;

  @ApiPropertyOptional({
    example: 'Support Team',
    description: 'Template-specific override sender display name',
  })
  @IsString()
  @IsOptional()
  senderName?: string;

  @ApiPropertyOptional({
    example: 'contact.submitted',
    description:
      'System event this template is designed for (enables variable discovery)',
  })
  @IsString()
  @IsOptional()
  linkedEvent?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateMessageTemplateDto extends PartialType(
  CreateMessageTemplateDto,
) {}

export class QueryMessageTemplateDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CommunicationChannel)
  channel?: CommunicationChannel;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SendTemplateMessageDto {
  @ApiProperty({
    example: 'welcome-email',
    description: 'Slug ID of the configured message template',
  })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Recipient identifier (email/phone)',
  })
  @IsNotEmpty()
  @IsString()
  recipient: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Recipient display name',
  })
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiProperty({
    example: {
      name: 'John Doe',
      verifyUrl: 'https://coremedia.com/verify/123',
    },
    description: 'Template dynamic variable mappings',
  })
  @IsObject()
  @IsNotEmpty()
  params: Record<string, any>;

  @ApiPropertyOptional({ example: 'sender@example.com' })
  @IsString()
  @IsOptional()
  senderEmail?: string;

  @ApiPropertyOptional({ example: 'Sender Name' })
  @IsString()
  @IsOptional()
  senderName?: string;
}

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { CommunicationChannel } from '../schemas/communication-log.schema';

export class CreateCommunicationProviderDto {
  @ApiProperty({ example: 'brevo', description: 'Internal name of the provider plugin' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Brevo (Sendinblue)', description: 'Human-readable display name' })
  @IsNotEmpty()
  @IsString()
  displayName: string;

  @ApiProperty({ enum: CommunicationChannel, example: CommunicationChannel.EMAIL })
  @IsNotEmpty()
  @IsEnum(CommunicationChannel)
  channel: CommunicationChannel;

  @ApiProperty({
    example: { apiKey: 'xkeysib-...' },
    description: 'API keys and access secrets (credentials)',
  })
  @IsObject()
  @IsOptional()
  credentials?: Record<string, any>;

  @ApiPropertyOptional({
    example: { senderEmail: 'info@coremedia.com', senderName: 'Core Media' },
    description: 'Default sender configuration settings',
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({ example: 1, description: 'Priority order of the provider' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ example: true, description: 'Whether the provider is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCommunicationProviderDto extends PartialType(CreateCommunicationProviderDto) {}

export class RegisterBrevoWebhookDto {
  @ApiProperty({
    example: 'https://core-media.com/api/v1/webhooks/brevo',
    description: 'The public URL where Brevo will POST webhook notifications to',
  })
  @IsNotEmpty()
  @IsString()
  url: string;
}

export class QueryCommunicationProviderDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CommunicationChannel)
  channel?: CommunicationChannel;
}

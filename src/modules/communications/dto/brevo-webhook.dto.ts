import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
} from 'class-validator';

/**
 * DTO representing the webhook payload that Brevo POSTs
 * for transactional email events (delivered, opened, click, bounce, etc.).
 *
 * Brevo docs: https://developers.brevo.com/docs/transactional-webhooks
 */
export class BrevoWebhookEventDto {
  @ApiProperty({
    example: 'delivered',
    description:
      'Brevo event type: request, delivered, opened, click, hard_bounce, soft_bounce, spam, invalid_email, deferred, blocked, error, unsubscribed',
  })
  @IsNotEmpty()
  @IsString()
  event: string;

  @ApiProperty({ example: 'user@example.com', description: 'Recipient email address' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiPropertyOptional({
    example: '<202606251110.26947417131@smtp-relay.mailin.fr>',
    description: 'The message-id header returned when the email was sent',
  })
  @IsOptional()
  @IsString()
  'message-id'?: string;

  @ApiPropertyOptional({ example: 1598634509, description: 'Unix timestamp of the event (UTC)' })
  @IsOptional()
  @IsNumber()
  ts_event?: number;

  @ApiPropertyOptional({ example: 1598634509223, description: 'Unix epoch timestamp in ms' })
  @IsOptional()
  @IsNumber()
  ts_epoch?: number;

  @ApiPropertyOptional({ example: 1598634509, description: 'Legacy Unix timestamp' })
  @IsOptional()
  @IsNumber()
  ts?: number;

  @ApiPropertyOptional({ example: '2025-06-25 12:00:00', description: 'Human readable date (CET/CEST)' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 'Core media testing mail', description: 'Email subject line' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: 26224, description: 'Brevo internal event ID' })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiPropertyOptional({ example: '185.41.28.109', description: 'IP used to send the email' })
  @IsOptional()
  @IsString()
  sending_ip?: string;

  @ApiPropertyOptional({ example: 3, description: 'Brevo template ID if template was used' })
  @IsOptional()
  @IsNumber()
  template_id?: number;

  @ApiPropertyOptional({ example: ['transactional'], description: 'Tags associated with the email' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ example: 'spam', description: 'Reason for bounce/deferred events' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'https://domain.com/page', description: 'Clicked URL (for click events)' })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 ...', description: 'User agent of the opener/clicker' })
  @IsOptional()
  @IsString()
  user_agent?: string;

  @ApiPropertyOptional({ example: 'DESKTOP', description: 'Device used to open/click (DESKTOP, MOBILE, TABLET)' })
  @IsOptional()
  @IsString()
  device_used?: string;
}

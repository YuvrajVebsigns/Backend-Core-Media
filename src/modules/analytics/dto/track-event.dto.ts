import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class TrackEventDto {
  @ApiProperty({ example: 'vis_8a7c29d0f41b' })
  @IsString()
  @IsNotEmpty()
  visitorId: string;

  @ApiProperty({ example: 'sess_9b8d1e2f3c4a' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: 'pageview', description: "Can be 'pageview', 'consent_accepted', 'consent_declined', or 'interaction'" })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiPropertyOptional({ example: '/blog/latest-news' })
  @IsOptional()
  @IsString()
  pageUrl?: string;

  @ApiPropertyOptional({ example: 'Latest News - CIO Choice' })
  @IsOptional()
  @IsString()
  pageTitle?: string;

  @ApiPropertyOptional({ example: 'https://google.com' })
  @IsOptional()
  @IsString()
  referrer?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ type: Object, example: { elementId: 'newsletter-signup-btn', duration: 12.5 } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

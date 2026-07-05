import { ApiProperty } from '@nestjs/swagger';

export class TrackEventResponseDto {
  @ApiProperty({ example: '60c72b2f9b1d8e25bc2f1234', description: 'Mongoose object ID' })
  _id: string;

  @ApiProperty({ example: '60c72b2f9b1d8e25bc2f5678', description: 'Website object ID' })
  websiteId: string;

  @ApiProperty({ example: 'vis_8a7c29d0f41b', description: 'Unique visitor ID' })
  visitorId: string;

  @ApiProperty({ example: 'sess_9b8d1e2f3c4a', description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ example: 'pageview', description: 'Event type' })
  eventType: string;

  @ApiProperty({ example: '/blog/latest-news', required: false, description: 'Page URL' })
  pageUrl?: string;

  @ApiProperty({ example: 'Latest News - CIO Choice', required: false, description: 'Page Title' })
  pageTitle?: string;

  @ApiProperty({ example: 'https://google.com', required: false, description: 'Referrer URL' })
  referrer?: string;

  @ApiProperty({ example: 'Mozilla/5.0...', required: false, description: 'User Agent' })
  userAgent?: string;

  @ApiProperty({ type: Object, example: { elementId: 'btn-submit' }, required: false, description: 'Extra interaction metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ example: '2026-07-04T12:00:00.000Z', description: 'Timestamp when event was logged' })
  createdAt: string;

  @ApiProperty({ example: '2026-07-04T12:00:00.000Z', description: 'Timestamp when event was updated' })
  updatedAt: string;
}

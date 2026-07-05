import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsMetricsDto {
  @ApiProperty({ example: 1250, description: 'Total page views' })
  pageViews: number;

  @ApiProperty({ example: 450, description: 'Unique visitors' })
  uniqueVisitors: number;

  @ApiProperty({ example: 500, description: 'Total sessions' })
  sessions: number;

  @ApiProperty({ example: 380, description: 'Total accepted cookie consents' })
  consentAccepts: number;

  @ApiProperty({ example: 20, description: 'Total declined cookie consents' })
  consentDeclines: number;

  @ApiProperty({ example: 95, description: 'Consent acceptance rate percentage' })
  consentRate: number;
}

export class TopPageDto {
  @ApiProperty({ example: '/blog/latest-news', description: 'URL of the page' })
  pageUrl: string;

  @ApiProperty({ example: 'Latest News - CIO Choice', description: 'Document Title of the page' })
  pageTitle: string;

  @ApiProperty({ example: 150, description: 'Page view count' })
  count: number;
}

export class TopReferrerDto {
  @ApiProperty({ example: 'https://google.com', description: 'Referrer URL or source' })
  referrer: string;

  @ApiProperty({ example: 200, description: 'Visitor/session count from this referrer' })
  count: number;
}

export class DailyTrendDto {
  @ApiProperty({ example: '2026-07-01', description: 'Date in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ example: 120, description: 'Total page views on this day' })
  pageViews: number;

  @ApiProperty({ example: 80, description: 'Unique visitors on this day' })
  uniqueVisitors: number;
}

export class RecentActivityDto {
  @ApiProperty({ example: '60c72b2f9b1d8e25bc2f1234', description: 'Mongoose object ID' })
  _id: string;

  @ApiProperty({ example: 'vis_8a7c29d0f41b', description: 'Unique client-side tracking ID' })
  visitorId: string;

  @ApiProperty({ example: 'sess_9b8d1e2f3c4a', description: 'Session tracking ID' })
  sessionId: string;

  @ApiProperty({ example: 'pageview', description: 'Type of analytics event tracked' })
  eventType: string;

  @ApiProperty({ example: '/blog/latest-news', required: false, description: 'Target page URL' })
  pageUrl?: string;

  @ApiProperty({ example: 'Latest News - CIO Choice', required: false, description: 'Target page title' })
  pageTitle?: string;

  @ApiProperty({ example: 'https://google.com', required: false, description: 'Referrer origin' })
  referrer?: string;

  @ApiProperty({ example: 'Mozilla/5.0...', required: false, description: 'User Agent string' })
  userAgent?: string;

  @ApiProperty({ example: '2026-07-04T12:00:00.000Z', description: 'Event timestamp' })
  createdAt: string;

  @ApiProperty({ type: Object, example: { elementId: 'btn-submit' }, required: false, description: 'Extra interaction properties' })
  metadata?: Record<string, any>;
}

export class AnalyticsSummaryResponseDto {
  @ApiProperty({ type: AnalyticsMetricsDto, description: 'Aggregated analytics metrics counts' })
  metrics: AnalyticsMetricsDto;

  @ApiProperty({ type: [TopPageDto], description: 'Top 10 most visited pages' })
  topPages: TopPageDto[];

  @ApiProperty({ type: [TopReferrerDto], description: 'Top 10 referrer sources' })
  topReferrers: TopReferrerDto[];

  @ApiProperty({ type: [DailyTrendDto], description: 'Daily trend points for traffic graphing' })
  dailyTrend: DailyTrendDto[];

  @ApiProperty({ type: [RecentActivityDto], description: 'Last 50 recorded events' })
  recentActivity: RecentActivityDto[];
}

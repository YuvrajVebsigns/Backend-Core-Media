import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';
import { TrackEventResponseDto } from './dto/track-event-response.dto';

@ApiTags('Website | Analytics')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteAuthGuard)
@Throttle({
  short: { ttl: 1000, limit: 30 },
  medium: { ttl: 60000, limit: 300 },
  long: { ttl: 3600000, limit: 10000 },
})
@Controller('website/analytics')
export class WebsiteAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @ApiOperation({
    summary: 'Track a visitor pageview, consent, or interaction event',
  })
  @ApiResponse({
    status: 201,
    description: 'Event tracked successfully',
    type: TrackEventResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized website token' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async track(
    @CurrentWebsite() website: any,
    @Body() trackEventDto: TrackEventDto,
  ) {
    return this.analyticsService.trackEvent(website.id, trackEventDto);
  }
}

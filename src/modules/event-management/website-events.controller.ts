import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EventsService } from './event-management.service';
import { EventStatus } from './schemas/event.schema';
import { QueryEventDto } from './dto/event.dto';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';
import { Types } from 'mongoose';

@ApiTags('Website | Events')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteAuthGuard)
@Throttle({ short: { ttl: 1000, limit: 30 }, medium: { ttl: 60000, limit: 300 }, long: { ttl: 3600000, limit: 10000 } })
@Controller('website/events')
export class WebsiteEventsController {
  constructor(private readonly eventService: EventsService) { }

  @Get()
  @ApiOperation({
    summary: 'Get all published events for public website',
    description: 'Fetches paginated list of events with summary fields only, scoped to the authenticated website.',
  })
  findAll(
    @CurrentWebsite() website: any,
    @Query() query: QueryEventDto,
  ) {
    const targetWebsiteId = website?.id || query.websiteId;
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;

    return this.eventService.findAllForWebsite({
      ...query,
      page,
      limit,
      websiteId: targetWebsiteId,
      status: query.status || EventStatus.PUBLISHED,
    });
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get an event by ID or slug' })
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    if (Types.ObjectId.isValid(idOrSlug)) {
      return this.eventService.findOne(idOrSlug);
    }
    return this.eventService.findBySlug(idOrSlug);
  }
}

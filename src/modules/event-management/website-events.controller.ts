import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { EventsService } from './event-management.service';
import { EventStatus } from './schemas/event.schema';

import { Types } from 'mongoose';

@ApiTags('Website | Events')
@Controller('website/events')
export class WebsiteEventsController {
  constructor(private readonly eventService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all published events for public website' })
  @ApiQuery({ name: 'websiteId', required: false })
  findAll(
    @Query('websiteId') websiteId?: string,
  ) {
    return this.eventService.findAll({ websiteId, status: EventStatus.PUBLISHED });
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

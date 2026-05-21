import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { EventManagementService } from './event-management.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { EventStatus } from './schemas/event.schema';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

@ApiTags('Event Management')
@Controller('event-management')
export class EventManagementController {
  constructor(private readonly eventService: EventManagementService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new event' })
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with optional filters' })
  @ApiQuery({ name: 'websiteId', required: false })
  @ApiQuery({ name: 'status', enum: EventStatus, required: false })
  findAll(
    @Query('websiteId') websiteId?: string,
    @Query('status') status?: EventStatus,
  ) {
    return this.eventService.findAll({ websiteId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event by id' })
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get an event by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.eventService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update an event' })
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventService.update(id, updateEventDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete an event' })
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }
}

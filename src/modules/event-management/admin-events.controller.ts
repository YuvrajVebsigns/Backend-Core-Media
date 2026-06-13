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
import { EventsService } from './event-management.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { CreateEventMeetingDto, UpdateEventMeetingDto } from './dto/event-meeting.dto';
import { EventStatus } from './schemas/event.schema';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { SystemUserRole } from '@common/enums/role.enum';

@ApiTags('Admin | Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Controller('admin/events')
export class AdminEventsController {
  constructor(private readonly eventService: EventsService) {}

  @Post()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('events.create')
  @ApiOperation({ summary: 'Create a new event' })
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventService.create(createEventDto);
  }

  @Get()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('events.view')
  @ApiOperation({ summary: 'Get all events with optional filters (Admin)' })
  @ApiQuery({ name: 'websiteId', required: false })
  @ApiQuery({ name: 'status', enum: EventStatus, required: false })
  findAll(
    @Query('websiteId') websiteId?: string,
    @Query('status') status?: EventStatus,
  ) {
    return this.eventService.findAll({ websiteId, status });
  }

  @Get(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('events.view')
  @ApiOperation({ summary: 'Get an event by ID (Admin)' })
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('events.update')
  @ApiOperation({ summary: 'Update an event' })
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventService.update(id, updateEventDto);
  }

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN)
  @Permission('events.delete')
  @ApiOperation({ summary: 'Delete an event' })
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }

  @Post(':eventId/meetings')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('events.update')
  @ApiOperation({ summary: 'Create a meeting reservation mapping for an event' })
  createMeeting(
    @Param('eventId') eventId: string,
    @Body() createMeetingDto: CreateEventMeetingDto,
  ) {
    return this.eventService.createMeeting(eventId, createMeetingDto);
  }

  @Get(':eventId/meetings')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('events.view')
  @ApiOperation({ summary: 'Get all meeting mapping reservations for an event' })
  findMeetings(@Param('eventId') eventId: string) {
    return this.eventService.findMeetingsByEvent(eventId);
  }

  @Patch(':eventId/meetings/:meetingId')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('events.update')
  @ApiOperation({ summary: 'Update a meeting mapping' })
  updateMeeting(
    @Param('eventId') eventId: string,
    @Param('meetingId') meetingId: string,
    @Body() updateMeetingDto: UpdateEventMeetingDto,
  ) {
    return this.eventService.updateMeeting(meetingId, updateMeetingDto);
  }

  @Delete(':eventId/meetings/:meetingId')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('events.update')
  @ApiOperation({ summary: 'Cancel/Delete a meeting mapping' })
  removeMeeting(
    @Param('eventId') eventId: string,
    @Param('meetingId') meetingId: string,
  ) {
    return this.eventService.removeMeeting(meetingId);
  }
}

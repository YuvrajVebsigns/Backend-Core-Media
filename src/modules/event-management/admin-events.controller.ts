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
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { EventsService } from './event-management.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import {
  CreateEventMeetingDto,
  UpdateEventMeetingDto,
} from './dto/event-meeting.dto';
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
  @UseInterceptors(
    FileInterceptor('bannerImage', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  @ApiOperation({ summary: 'Create a new event' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Create event with optional banner image upload and form details. Note: nested fields (location, websites, sponsors, agenda, seo, invitedEmails) should be passed as JSON strings when using multipart/form-data.',
    schema: {
      type: 'object',
      properties: {
        bannerImage: {
          type: 'string',
          format: 'binary',
          description: 'Banner image file to upload',
        },
        title: { type: 'string', example: 'Digital Transformation Webinar' },
        slug: { type: 'string', example: 'digital-transformation-webinar' },
        description: {
          type: 'string',
          description: 'EditorJS description content (JSON string or object)',
        },
        excerpt: { type: 'string', example: 'A brief summary of the webinar' },
        type: { type: 'string', enum: ['ONLINE', 'OFFLINE'] },
        status: {
          type: 'string',
          enum: [
            'DRAFT',
            'PUBLISHED',
            'COMPLETED',
            'CANCELLED',
            'ON_GOING',
            'SCHEDULED',
            'IN_REVIEW',
          ],
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          example: '2026-06-03T12:30:00.000Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          example: '2026-06-03T20:30:00.000Z',
        },
        location: {
          type: 'string',
          description: 'JSON string of event location',
        },
        meetingLink: { type: 'string', example: 'https://zoom.us/j/123456789' },
        websites: {
          type: 'string',
          description: 'JSON string array of website IDs',
        },
        sponsors: {
          type: 'string',
          description: 'JSON string array of sponsor IDs',
        },
        agenda: {
          type: 'string',
          description: 'JSON string array of agenda items',
        },
        seo: {
          type: 'string',
          description: 'JSON string of SEO metadata object',
        },
        isActive: { type: 'boolean' },
        invitedEmails: {
          type: 'string',
          description: 'JSON string array of invited emails',
        },
      },
      required: [
        'title',
        'slug',
        'description',
        'type',
        'startDate',
        'endDate',
      ],
    },
  })
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createEventDto: CreateEventDto,
    @Request() req: any,
  ) {
    return this.eventService.create(createEventDto, file, req.user.id);
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
  @UseInterceptors(
    FileInterceptor('bannerImage', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  @ApiOperation({ summary: 'Update an event' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Update event with optional new banner image file upload and form details. Note: nested fields (location, websites, sponsors, agenda, seo, invitedEmails) should be passed as JSON strings when using multipart/form-data.',
    schema: {
      type: 'object',
      properties: {
        bannerImage: {
          type: 'string',
          format: 'binary',
          description: 'New banner image file to upload',
        },
        title: { type: 'string', example: 'Digital Transformation Webinar' },
        slug: { type: 'string', example: 'digital-transformation-webinar' },
        description: {
          type: 'string',
          description: 'EditorJS description content (JSON string or object)',
        },
        excerpt: { type: 'string', example: 'A brief summary of the webinar' },
        type: { type: 'string', enum: ['ONLINE', 'OFFLINE'] },
        status: {
          type: 'string',
          enum: [
            'DRAFT',
            'PUBLISHED',
            'COMPLETED',
            'CANCELLED',
            'ON_GOING',
            'SCHEDULED',
            'IN_REVIEW',
          ],
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          example: '2026-06-03T12:30:00.000Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          example: '2026-06-03T20:30:00.000Z',
        },
        location: {
          type: 'string',
          description: 'JSON string of event location',
        },
        meetingLink: { type: 'string', example: 'https://zoom.us/j/123456789' },
        websites: {
          type: 'string',
          description: 'JSON string array of website IDs',
        },
        sponsors: {
          type: 'string',
          description: 'JSON string array of sponsor IDs',
        },
        agenda: {
          type: 'string',
          description: 'JSON string array of agenda items',
        },
        seo: {
          type: 'string',
          description: 'JSON string of SEO metadata object',
        },
        isActive: { type: 'boolean' },
        invitedEmails: {
          type: 'string',
          description: 'JSON string array of invited emails',
        },
      },
    },
  })
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: any,
  ) {
    return this.eventService.update(id, updateEventDto, file, req.user.id);
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
  @ApiOperation({
    summary: 'Create a meeting reservation mapping for an event',
  })
  createMeeting(
    @Param('eventId') eventId: string,
    @Body() createMeetingDto: CreateEventMeetingDto,
  ) {
    return this.eventService.createMeeting(eventId, createMeetingDto);
  }

  @Get(':eventId/meetings')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('events.view')
  @ApiOperation({
    summary: 'Get all meeting mapping reservations for an event',
  })
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

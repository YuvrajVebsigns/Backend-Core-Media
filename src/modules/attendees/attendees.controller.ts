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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { AttendeesService } from './attendees.service';
import {
  CreateAttendeeDto,
  UpdateAttendeeDto,
  QueryAttendeeDto,
} from './dto/attendee.dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { SystemUserRole } from '@common/enums/role.enum';

@ApiTags('Admin | Attendees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Controller('admin/attendees')
export class AdminAttendeesController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Patch(':passCode/check-in')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('registrations.update')
  @ApiOperation({
    summary: 'Mark attendance at registration desk',
    description: 'Verifies the passcode and marks the attendee as checked in.',
  })
  @ApiParam({
    name: 'passCode',
    description: 'Unique passcode of the attendee.',
  })
  @ApiResponse({ status: 200, description: 'Successfully checked in.' })
  @ApiResponse({
    status: 400,
    description: 'Attendee is already checked in or blocked.',
  })
  @ApiResponse({ status: 404, description: 'Passcode is invalid.' })
  checkIn(@Param('passCode') passCode: string, @Request() req: any) {
    const user = req?.user;
    const checkedInBy = user
      ? {
          userId: user.id,
          name: user.fullName || user.name || 'System User',
          email: user.email,
        }
      : undefined;
    return this.attendeesService.checkIn(passCode, checkedInBy);
  }

  @Get('event/:eventId')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('registrations.view')
  @ApiOperation({
    summary: 'Get all attendees for an event',
    description:
      'Fetches the list of all registered attendees for a specific event with nested event and sponsor details.',
  })
  @ApiParam({ name: 'eventId', description: 'MongoDB ID of the event.' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved attendees list.',
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  findAllByEvent(@Param('eventId') eventId: string) {
    return this.attendeesService.findAllByEvent(eventId);
  }

  @Get('event/:eventId/count')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('registrations.view')
  @ApiOperation({
    summary: 'Get attendee count for an event',
    description:
      'Fetches the count of all registered attendees for a specific event.',
  })
  @ApiParam({ name: 'eventId', description: 'MongoDB ID of the event.' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved attendee count.',
  })
  getCountByEvent(@Param('eventId') eventId: string) {
    return this.attendeesService.getCountByEvent(eventId);
  }

  @Get()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('registrations.view')
  @ApiOperation({ summary: 'Get all attendees with query filter (Admin)' })
  findAll(@Query() query: QueryAttendeeDto) {
    return this.attendeesService.findAll(query);
  }

  @Get(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('registrations.view')
  @ApiOperation({ summary: 'Get an attendee by ID (Admin)' })
  findOne(@Param('id') id: string) {
    return this.attendeesService.findOne(id);
  }

  @Post()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('registrations.create')
  @ApiOperation({ summary: 'Manually create/invite an attendee (Admin)' })
  create(@Body() createDto: CreateAttendeeDto) {
    return this.attendeesService.create(createDto);
  }

  @Patch(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('registrations.update')
  @ApiOperation({ summary: 'Update attendee profile details (Admin)' })
  update(@Param('id') id: string, @Body() updateDto: UpdateAttendeeDto) {
    return this.attendeesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('registrations.delete')
  @ApiOperation({ summary: 'Delete/Cancel an attendee registration (Admin)' })
  remove(@Param('id') id: string) {
    return this.attendeesService.remove(id);
  }
}

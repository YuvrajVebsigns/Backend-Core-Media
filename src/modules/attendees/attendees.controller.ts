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
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendeesService } from './attendees.service';
import {
  RegisterAttendeeDto,
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
import { Throttle } from '@nestjs/throttler';

@Controller('attendees')
export class AttendeesController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @ApiTags('Website | Attendees')
  @Post('register')
  @Throttle({
    short: { ttl: 1000, limit: 2 },
    medium: { ttl: 60000, limit: 5 },
    long: { ttl: 3600000, limit: 50 },
  })
  @ApiOperation({
    summary: 'Register for an event',
    description: 'Registers a new attendee for the specified event and schedules a welcome/pass email notification.',
  })
  @ApiResponse({ status: 201, description: 'Successfully registered for the event.' })
  @ApiResponse({ status: 409, description: 'Already registered for this event with this email.' })
  @ApiResponse({ status: 404, description: 'Specified event not found.' })
  @ApiHeader({
    name: 'x-website-id',
    description: 'Optional website ID from which the registration originated.',
    required: false,
  })
  register(
    @Body() registerDto: RegisterAttendeeDto,
    @Headers('x-website-id') websiteId?: string,
  ) {
    return this.attendeesService.register(registerDto, websiteId);
  }

  @ApiTags('Admin | Attendees')
  @Patch(':passCode/check-in')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Mark attendance at registration desk',
    description: 'Verifies the passcode and marks the attendee as checked in.',
  })
  @ApiParam({ name: 'passCode', description: 'Unique passcode of the attendee.' })
  @ApiResponse({ status: 200, description: 'Successfully checked in.' })
  @ApiResponse({ status: 400, description: 'Attendee is already checked in or blocked.' })
  @ApiResponse({ status: 404, description: 'Passcode is invalid.' })
  checkIn(@Param('passCode') passCode: string) {
    return this.attendeesService.checkIn(passCode);
  }

  @ApiTags('Admin | Attendees')
  @Get('event/:eventId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all attendees for an event',
    description: 'Fetches the list of all registered attendees for a specific event with nested event and sponsor details.',
  })
  @ApiParam({ name: 'eventId', description: 'MongoDB ID of the event.' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved attendees list.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  findAllByEvent(@Param('eventId') eventId: string) {
    return this.attendeesService.findAllByEvent(eventId);
  }

  @ApiTags('Admin | Attendees')
  @Get('event/:eventId/count')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get attendee count for an event',
    description: 'Fetches the count of all registered attendees for a specific event.',
  })
  @ApiParam({ name: 'eventId', description: 'MongoDB ID of the event.' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved attendee count.' })
  getCountByEvent(@Param('eventId') eventId: string) {
    return this.attendeesService.getCountByEvent(eventId);
  }

  @ApiTags('Admin | Attendees')
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('registrations.view')
  @ApiOperation({ summary: 'Get all attendees with query filter (Admin)' })
  findAll(@Query() query: QueryAttendeeDto) {
    return this.attendeesService.findAll(query);
  }

  @ApiTags('Admin | Attendees')
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('registrations.view')
  @ApiOperation({ summary: 'Get an attendee by ID (Admin)' })
  findOne(@Param('id') id: string) {
    return this.attendeesService.findOne(id);
  }

  @ApiTags('Admin | Attendees')
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('registrations.create')
  @ApiOperation({ summary: 'Manually create/invite an attendee (Admin)' })
  create(@Body() createDto: CreateAttendeeDto) {
    return this.attendeesService.create(createDto);
  }

  @ApiTags('Admin | Attendees')
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('registrations.update')
  @ApiOperation({ summary: 'Update attendee profile details (Admin)' })
  update(@Param('id') id: string, @Body() updateDto: UpdateAttendeeDto) {
    return this.attendeesService.update(id, updateDto);
  }

  @ApiTags('Admin | Attendees')
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('registrations.delete')
  @ApiOperation({ summary: 'Delete/Cancel an attendee registration (Admin)' })
  remove(@Param('id') id: string) {
    return this.attendeesService.remove(id);
  }

  @ApiTags('Website | Attendees')
  @Get('pass/:passCode')
  @ApiOperation({
    summary: 'Get attendee details by pass code',
    description: 'Retrieves public attendee registration info populated with event and sponsor details.',
  })
  @ApiParam({ name: 'passCode', description: 'Unique passcode of the attendee.' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved attendee pass details.' })
  @ApiResponse({ status: 404, description: 'Passcode is invalid.' })
  findByPassCode(@Param('passCode') passCode: string) {
    return this.attendeesService.findByPassCode(passCode);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendeesService } from './attendees.service';
import { RegisterAttendeeDto } from './dto/attendee.dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

@ApiTags('Attendees')
@Controller('attendees')
export class AttendeesController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register for an event' })
  register(@Body() registerDto: RegisterAttendeeDto) {
    return this.attendeesService.register(registerDto);
  }

  @Patch(':passCode/check-in')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark attendance at registration desk' })
  checkIn(@Param('passCode') passCode: string) {
    return this.attendeesService.checkIn(passCode);
  }

  @Get('event/:eventId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all attendees for an event' })
  findAllByEvent(@Param('eventId') eventId: string) {
    return this.attendeesService.findAllByEvent(eventId);
  }
}

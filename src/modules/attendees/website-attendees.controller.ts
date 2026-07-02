import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AttendeesService } from './attendees.service';
import { RegisterAttendeeDto } from './dto/attendee.dto';
import { Throttle } from '@nestjs/throttler';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';

@ApiTags('Website | Attendees')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteAuthGuard)
@Controller('website/attendees')
export class WebsiteAttendeesController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Post('register')
  @Throttle({
    short: { ttl: 1000, limit: 2 },
    medium: { ttl: 60000, limit: 5 },
    long: { ttl: 3600000, limit: 50 },
  })
  @ApiOperation({
    summary: 'Register for an event',
    description:
      'Registers a new attendee for the specified event and schedules a welcome/pass email notification.',
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully registered for the event.',
  })
  @ApiResponse({
    status: 409,
    description: 'Already registered for this event with this email.',
  })
  @ApiResponse({ status: 404, description: 'Specified event not found.' })
  @ApiHeader({
    name: 'x-website-id',
    description: 'Optional fallback website ID',
    required: false,
  })
  register(
    @Body() registerDto: RegisterAttendeeDto,
    @CurrentWebsite() website: any,
    @Headers('x-website-id') websiteIdHeader?: string,
  ) {
    const targetWebsiteId = website?.id || websiteIdHeader;
    return this.attendeesService.register(registerDto, targetWebsiteId);
  }

  @Get('pass/:passCode')
  @ApiOperation({
    summary: 'Get attendee details by pass code',
    description:
      'Retrieves public attendee registration info populated with event and sponsor details.',
  })
  @ApiParam({
    name: 'passCode',
    description: 'Unique passcode of the attendee.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved attendee pass details.',
  })
  @ApiResponse({ status: 404, description: 'Passcode is invalid.' })
  findByPassCode(@Param('passCode') passCode: string) {
    return this.attendeesService.findByPassCode(passCode);
  }
}

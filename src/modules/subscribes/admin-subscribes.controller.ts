import {
  Controller,
  Get,
  Query,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import { SubscribesService } from './subscribes.service';
import {
  QuerySubscribeDto,
  SendSelectedSubscribersDto,
} from './dto/subscribe.dto';

@ApiTags('Admin | Subscribes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/subscribes')
export class AdminSubscribesController {
  constructor(private readonly subscribesService: SubscribesService) {}

  @Get()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'Get all subscriptions with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of subscriptions' })
  findAll(@Query() queryDto: QuerySubscribeDto) {
    return this.subscribesService.findAll(queryDto);
  }

  @Get(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'Get subscription details by ID' })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  findOne(@Param('id') id: string) {
    return this.subscribesService.findOne(id);
  }

  @Post('send-selected')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Send bulk email to selected subscribers',
    description:
      'Fetches selected subscribers by ID and sends the same HTML email content to only those chosen recipients through the active Brevo communication provider.',
  })
  @ApiResponse({ status: 201, description: 'Bulk email queued successfully' })
  sendSelectedSubscribers(@Body() dto: SendSelectedSubscribersDto) {
    return this.subscribesService.sendSelectedEmails(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete a subscription' })
  @ApiResponse({ status: 244, description: 'No content (success)' })
  remove(@Param('id') id: string) {
    return this.subscribesService.remove(id);
  }
}

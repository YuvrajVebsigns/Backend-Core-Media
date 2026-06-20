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
  ApiResponse,
} from '@nestjs/swagger';
import { CommunicationsService } from './communications.service';
import {
  QueryCommunicationLogDto,
  SendManualMessageDto,
} from './dto/communication-log.dto';
import {
  CreateWebhookSubscriptionDto,
  UpdateWebhookSubscriptionDto,
  QueryWebhookSubscriptionDto,
} from './dto/webhook-subscription.dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemUserRole } from '@common/enums/role.enum';

@ApiTags('Admin | Communications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/communications')
export class AdminCommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Get('logs')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'Get all communication logs with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAllLogs(@Query() queryDto: QueryCommunicationLogDto) {
    return this.communicationsService.findAllLogs(queryDto);
  }

  @Get('logs/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'Get communication log details by ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  findOneLog(@Param('id') id: string) {
    return this.communicationsService.findOneLog(id);
  }

  @Post('send')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Trigger a manual communication alert (email/sms/push)' })
  @ApiResponse({ status: 201, description: 'Message queued successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  sendManualMessage(@Body() dto: SendManualMessageDto) {
    return this.communicationsService.dispatch(
      dto.channel,
      dto.recipient,
      dto.title,
      dto.content,
      dto.metadata,
    );
  }

  @Post('webhooks')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new webhook subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  createWebhookSubscription(@Body() dto: CreateWebhookSubscriptionDto) {
    return this.communicationsService.createWebhookSubscription(dto);
  }

  @Get('webhooks')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'List all webhook subscriptions with pagination' })
  @ApiResponse({ status: 200, description: 'Success' })
  findAllWebhookSubscriptions(@Query() queryDto: QueryWebhookSubscriptionDto) {
    return this.communicationsService.findAllWebhookSubscriptions(queryDto);
  }

  @Get('webhooks/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'Get details of a webhook subscription' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  findOneWebhookSubscription(@Param('id') id: string) {
    return this.communicationsService.findOneWebhookSubscription(id);
  }

  @Patch('webhooks/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Update a webhook subscription' })
  @ApiResponse({ status: 200, description: 'Updated successfully' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  updateWebhookSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookSubscriptionDto,
  ) {
    return this.communicationsService.updateWebhookSubscription(id, dto);
  }

  @Delete('webhooks/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a webhook subscription' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  removeWebhookSubscription(@Param('id') id: string) {
    return this.communicationsService.removeWebhookSubscription(id);
  }
}

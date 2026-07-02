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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CommunicationsService } from './communications.service';
import { TemplateService } from './services/template.service';
import { ProviderRegistryService } from './providers/provider-registry.service';
import {
  QueryCommunicationLogDto,
  SendManualMessageDto,
} from './dto/communication-log.dto';
import {
  CreateWebhookSubscriptionDto,
  UpdateWebhookSubscriptionDto,
  QueryWebhookSubscriptionDto,
} from './dto/webhook-subscription.dto';
import {
  CreateCommunicationProviderDto,
  UpdateCommunicationProviderDto,
  RegisterBrevoWebhookDto,
  CreateBrevoSenderDto,
} from './dto/communication-provider.dto';
import {
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  QueryMessageTemplateDto,
  SendTemplateMessageDto,
} from './dto/message-template.dto';
import {
  CreateEventTemplateMappingDto,
  UpdateEventTemplateMappingDto,
} from './dto/event-template-mapping.dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import {
  AppEvents,
  EventPayloadRegistry,
} from '@modules/events/event-definitions';

@ApiTags('Admin | Communications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/communications')
export class AdminCommunicationsController {
  constructor(
    private readonly communicationsService: CommunicationsService,
    private readonly templateService: TemplateService,
    private readonly providerRegistry: ProviderRegistryService,
  ) {}

  // 1. Communication Logs
  @Get('logs')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'Get all communication logs with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'Success' })
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

  @Post('logs/:id/sync')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary:
      'Manual sync / fetch latest status update from provider for a communication log',
  })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  syncLogStatus(@Param('id') id: string) {
    return this.communicationsService.syncLogStatusWithProvider(id);
  }

  @Post('send')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Trigger a manual communication alert (email/sms/push)',
  })
  @ApiResponse({ status: 201, description: 'Message queued successfully' })
  sendManualMessage(@Body() dto: SendManualMessageDto) {
    return this.communicationsService.dispatch(
      dto.channel,
      dto.recipient,
      dto.title,
      dto.content,
      dto.metadata,
    );
  }

  // 2. Providers (Plugins) Settings CRUD
  @Get('providers')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'List all communication providers with statuses' })
  findAllProviders() {
    return this.providerRegistry.getAllProviders();
  }

  @Post('providers')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Register/Configure a new provider plugin' })
  createProvider(@Body() dto: CreateCommunicationProviderDto) {
    return this.communicationsService.createProvider(dto);
  }

  @Patch('providers/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Update provider config or credentials' })
  updateProvider(
    @Param('id') id: string,
    @Body() dto: UpdateCommunicationProviderDto,
  ) {
    return this.communicationsService.updateProvider(id, dto);
  }

  @Delete('providers/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a provider plugin config' })
  removeProvider(@Param('id') id: string) {
    return this.communicationsService.removeProvider(id);
  }

  @Get('providers/:name/health')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'Health check integration with provider API' })
  async checkProviderHealth(@Param('name') name: string) {
    const provider = this.providerRegistry.getProvider(name);
    const result = await provider.healthCheck();
    return { name, ...result };
  }

  // 3. Message Templates Management CRUD
  @Get('templates')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'List all message templates with pagination' })
  findAllTemplates(@Query() queryDto: QueryMessageTemplateDto) {
    return this.templateService.findAll(queryDto);
  }

  @Get('templates/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'Get details of a single message template' })
  findOneTemplate(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @Post('templates')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Create a local template and push to Brevo' })
  createTemplate(@Body() dto: CreateMessageTemplateDto) {
    return this.templateService.create(dto);
  }

  @Patch('templates/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a local template and push updates to Brevo',
  })
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateMessageTemplateDto,
  ) {
    return this.templateService.update(id, dto);
  }

  @Delete('templates/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Delete message template' })
  removeTemplate(@Param('id') id: string) {
    return this.templateService.remove(id);
  }

  // Bidirectional Synchronization Endpoints
  @Post('templates/sync')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Perform bidirectional sync of all templates with Brevo',
  })
  async syncAllTemplates() {
    return this.templateService.syncAllWithBrevo();
  }

  @Post('templates/:id/sync/to-provider')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Push local design template to Brevo SMTP templates',
  })
  async syncLocalTemplate(@Param('id') id: string) {
    const template = await this.templateService.findOne(id);
    await this.templateService.syncToBrevo(template);
    return { message: 'Local template synced to Brevo successfully.' };
  }

  @Post('templates/sync/from-provider/:externalId')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary:
      'Fetch template design from Brevo and import/update local template',
  })
  syncFromProvider(@Param('externalId') externalId: number) {
    return this.templateService.syncFromBrevo(Number(externalId));
  }

  @Post('templates/send')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Dispatch template message with parameters' })
  sendTemplateMessage(@Body() dto: SendTemplateMessageDto) {
    return this.communicationsService.dispatchTemplateMessage(dto);
  }

  // 4. Webhook Subscriptions
  @Post('webhooks')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new webhook subscription' })
  createWebhookSubscription(@Body() dto: CreateWebhookSubscriptionDto) {
    return this.communicationsService.createWebhookSubscription(dto);
  }

  @Get('webhooks')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'List all webhook subscriptions with pagination' })
  findAllWebhookSubscriptions(@Query() queryDto: QueryWebhookSubscriptionDto) {
    return this.communicationsService.findAllWebhookSubscriptions(queryDto);
  }

  @Get('webhooks/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'Get details of a webhook subscription' })
  findOneWebhookSubscription(@Param('id') id: string) {
    return this.communicationsService.findOneWebhookSubscription(id);
  }

  @Patch('webhooks/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Update a webhook subscription' })
  updateWebhookSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookSubscriptionDto,
  ) {
    return this.communicationsService.updateWebhookSubscription(id, dto);
  }

  @Delete('webhooks/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a webhook subscription' })
  removeWebhookSubscription(@Param('id') id: string) {
    return this.communicationsService.removeWebhookSubscription(id);
  }

  // 5. Programmatic Brevo Webhook Management
  @Post('providers/brevo/webhook')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Programmatically register/configure webhook with Brevo',
  })
  registerBrevoWebhook(@Body() dto: RegisterBrevoWebhookDto) {
    return this.communicationsService.registerBrevoWebhook(dto.url);
  }

  @Delete('providers/brevo/webhook')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Programmatically delete webhook from Brevo' })
  unregisterBrevoWebhook() {
    return this.communicationsService.unregisterBrevoWebhook();
  }

  @Get('providers/brevo/senders')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'Retrieve all senders registered on Brevo' })
  getBrevoSenders() {
    return this.communicationsService.getBrevoSenders();
  }

  @Post('providers/brevo/senders')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Register a new sender with Brevo' })
  createBrevoSender(@Body() dto: CreateBrevoSenderDto) {
    return this.communicationsService.createBrevoSender(dto);
  }

  @Delete('providers/brevo/senders/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a registered sender from Brevo' })
  deleteBrevoSender(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Sender ID must be a numeric value.');
    }
    return this.communicationsService.deleteBrevoSender(numericId);
  }

  // 6. System Events Discovery
  @Get('system-events')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'List all registered system event names for mapping',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns categorised system events',
  })
  getSystemEvents() {
    const categories: Record<string, { key: string; value: string }[]> = {};

    for (const [key, value] of Object.entries(AppEvents)) {
      const category = (value as string).split('.')[0];
      if (!categories[category]) categories[category] = [];
      categories[category].push({ key, value: value });
    }

    return {
      events: Object.values(AppEvents),
      categories,
      payloadRegistry: EventPayloadRegistry,
    };
  }

  // 7. Event-Template Mappings CRUD
  @Get('event-mappings')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'List all event-template mappings' })
  findAllEventMappings() {
    return this.communicationsService.findAllEventMappings();
  }

  @Post('event-mappings')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new event-template mapping' })
  createEventMapping(@Body() dto: CreateEventTemplateMappingDto) {
    return this.communicationsService.createEventMapping(dto);
  }

  @Patch('event-mappings/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Update an event-template mapping' })
  updateEventMapping(
    @Param('id') id: string,
    @Body() dto: UpdateEventTemplateMappingDto,
  ) {
    return this.communicationsService.updateEventMapping(id, dto);
  }

  @Delete('event-mappings/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete an event-template mapping' })
  removeEventMapping(@Param('id') id: string) {
    return this.communicationsService.deleteEventMapping(id);
  }
}

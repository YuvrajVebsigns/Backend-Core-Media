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
  ApiParam,
  ApiQuery,
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

import { SchemaDiscoveryService } from './services/schema-discovery.service';

@ApiTags('Admin | Communications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/communications')
export class AdminCommunicationsController {
  constructor(
    private readonly communicationsService: CommunicationsService,
    private readonly templateService: TemplateService,
    private readonly providerRegistry: ProviderRegistryService,
    private readonly schemaDiscoveryService: SchemaDiscoveryService,
  ) {}

  @Get('schema-discovery')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'Discover Mongoose database collections/relations and communication variables',
    description:
      'Returns all discoverable Mongoose schema collections with their fields, relations, ' +
      'and registered communication variables for use in template variable mapping.',
  })
  @ApiResponse({ status: 200, description: 'List of discoverable collections and fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async getSchemaDiscovery() {
    return this.schemaDiscoveryService.discoverSchemas();
  }

  @Get('schema-discovery/raw-mongoose')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'Discover raw Mongoose database collections/relations for reference',
    description: 'Returns raw Mongoose schema introspection data without communication variable mapping overlay.',
  })
  @ApiResponse({ status: 200, description: 'List of raw Mongoose collections and fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  getRawMongooseSchemaDiscovery() {
    return this.schemaDiscoveryService.discoverRawMongooseSchemas();
  }

  // 1. Communication Logs
  @Get('logs')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'List all communication logs with pagination and filters',
    description: 'Returns paginated email/SMS/push communication logs. Filter by channel, status, or search by recipient/title.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by recipient, title, or content' })
  @ApiQuery({ name: 'channel', required: false, type: String, description: 'Filter by channel (email, sms, push)' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by delivery status' })
  @ApiResponse({ status: 200, description: 'Paginated list of communication logs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  findAllLogs(@Query() queryDto: QueryCommunicationLogDto) {
    return this.communicationsService.findAllLogs(queryDto);
  }

  @Get('logs/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'Get communication log details by ID',
    description: 'Returns full details of a single communication log including delivery status, provider response, and metadata.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the communication log' })
  @ApiResponse({ status: 200, description: 'Communication log details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Communication log not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  findOneLog(@Param('id') id: string) {
    return this.communicationsService.findOneLog(id);
  }

  @Post('logs/:id/sync')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'Sync communication log status with provider',
    description: 'Manually fetches the latest delivery status from the email provider (e.g. Brevo) and updates the local log record.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the communication log to sync' })
  @ApiResponse({ status: 200, description: 'Log status synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Communication log not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  syncLogStatus(@Param('id') id: string) {
    return this.communicationsService.syncLogStatusWithProvider(id);
  }

  @Post('send')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Send a manual communication message',
    description: 'Dispatches a one-off email, SMS, or push notification to a single recipient. The message is queued via the configured provider.',
  })
  @ApiResponse({ status: 201, description: 'Message queued successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
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
  @ApiOperation({
    summary: 'List all communication providers with statuses',
    description: 'Returns all registered communication providers (e.g. Brevo) along with their current active/inactive status and configuration.',
  })
  @ApiResponse({ status: 200, description: 'List of all providers with statuses' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  findAllProviders() {
    return this.providerRegistry.getAllProviders();
  }

  @Post('providers')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Register a new communication provider plugin',
    description: 'Creates and configures a new email/SMS/push provider with API credentials and default sender settings.',
  })
  @ApiResponse({ status: 201, description: 'Provider registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  createProvider(@Body() dto: CreateCommunicationProviderDto) {
    return this.communicationsService.createProvider(dto);
  }

  @Patch('providers/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Update provider configuration or credentials',
    description: 'Partially updates an existing provider\'s API credentials, sender configuration, priority, or active status.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the provider' })
  @ApiResponse({ status: 200, description: 'Provider updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  updateProvider(
    @Param('id') id: string,
    @Body() dto: UpdateCommunicationProviderDto,
  ) {
    return this.communicationsService.updateProvider(id, dto);
  }

  @Delete('providers/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Remove a provider plugin configuration',
    description: 'Deletes the provider record and its credentials from the system.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the provider' })
  @ApiResponse({ status: 200, description: 'Provider removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  removeProvider(@Param('id') id: string) {
    return this.communicationsService.removeProvider(id);
  }

  @Get('providers/:name/health')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'Check provider health status',
    description: 'Performs a real-time health check against the provider\'s API to verify connectivity and authentication.',
  })
  @ApiParam({ name: 'name', description: 'Provider name (e.g. brevo)' })
  @ApiResponse({ status: 200, description: 'Health check result with connected status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async checkProviderHealth(@Param('name') name: string) {
    const provider = this.providerRegistry.getProvider(name);
    const result = await provider.healthCheck();
    return { name, ...result };
  }

  // 3. Message Templates Management CRUD
  @Get('templates')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'List all message templates with pagination',
    description: 'Returns paginated email/SMS templates. Filter by channel, active status, or search by name/slug.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by template name or slug' })
  @ApiQuery({ name: 'channel', required: false, type: String, description: 'Filter by channel (email, sms, push)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Paginated list of message templates' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  findAllTemplates(@Query() queryDto: QueryMessageTemplateDto) {
    return this.templateService.findAll(queryDto);
  }

  @Get('templates/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'Get message template details by ID',
    description: 'Returns full template details including HTML content, variables, sender config, and Brevo sync status.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the message template' })
  @ApiResponse({ status: 200, description: 'Message template details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  findOneTemplate(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @Post('templates')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new message template and push to Brevo',
    description: 'Creates a local email/SMS template record and automatically syncs it to the Brevo SMTP template library.',
  })
  @ApiResponse({ status: 201, description: 'Template created and synced to Brevo' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  createTemplate(@Body() dto: CreateMessageTemplateDto) {
    return this.templateService.create(dto);
  }

  @Patch('templates/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a message template and push changes to Brevo',
    description: 'Partially updates a local template and syncs the changes to Brevo. Only provided fields are updated.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the message template' })
  @ApiResponse({ status: 200, description: 'Template updated and synced' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateMessageTemplateDto,
  ) {
    return this.templateService.update(id, dto);
  }

  @Delete('templates/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a message template',
    description: 'Soft-deletes the local template record. The Brevo copy may remain and require manual cleanup.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the message template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  removeTemplate(@Param('id') id: string) {
    return this.templateService.remove(id);
  }

  // Bidirectional Synchronization Endpoints
  @Post('templates/sync')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Bidirectional sync of all templates with Brevo',
    description: 'Compares local templates with Brevo SMTP templates and syncs in both directions. New remote templates are imported; local changes are pushed.',
  })
  @ApiResponse({ status: 201, description: 'Sync completed with summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async syncAllTemplates() {
    return this.templateService.syncAllWithBrevo();
  }

  @Post('templates/:id/sync/to-provider')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Push a local template to Brevo',
    description: 'Pushes the local template\'s HTML content and subject to the corresponding Brevo SMTP template.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the local template to push' })
  @ApiResponse({ status: 201, description: 'Template synced to Brevo successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async syncLocalTemplate(@Param('id') id: string) {
    const template = await this.templateService.findOne(id);
    await this.templateService.syncToBrevo(template);
    return { message: 'Local template synced to Brevo successfully.' };
  }

  @Post('templates/sync/from-provider/:externalId')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Import a template from Brevo by external ID',
    description: 'Fetches a template from Brevo by its numeric external ID and creates or updates the corresponding local template.',
  })
  @ApiParam({ name: 'externalId', description: 'Brevo numeric template ID to import from' })
  @ApiResponse({ status: 201, description: 'Template imported from Brevo' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Brevo template not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  syncFromProvider(@Param('externalId') externalId: number) {
    return this.templateService.syncFromBrevo(Number(externalId));
  }

  @Post('templates/send')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Send a template-based message with dynamic parameters',
    description: 'Dispatches an email using a pre-configured template slug with dynamic variable substitution. Supports CC, BCC, and custom sender overrides.',
  })
  @ApiResponse({ status: 201, description: 'Template message dispatched' })
  @ApiResponse({ status: 400, description: 'Invalid request body or missing required params' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Template slug not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  sendTemplateMessage(@Body() dto: SendTemplateMessageDto) {
    return this.communicationsService.dispatchTemplateMessage(dto);
  }

  // 4. Webhook Subscriptions
  @Post('webhooks')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new webhook subscription',
    description: 'Registers a new outbound webhook that will receive POST notifications for specified system events.',
  })
  @ApiResponse({ status: 201, description: 'Webhook subscription created' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  createWebhookSubscription(@Body() dto: CreateWebhookSubscriptionDto) {
    return this.communicationsService.createWebhookSubscription(dto);
  }

  @Get('webhooks')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'List all webhook subscriptions with pagination',
    description: 'Returns paginated outbound webhook subscriptions. Filter by active status or search by URL.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by webhook URL' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Paginated list of webhook subscriptions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  findAllWebhookSubscriptions(@Query() queryDto: QueryWebhookSubscriptionDto) {
    return this.communicationsService.findAllWebhookSubscriptions(queryDto);
  }

  @Get('webhooks/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'Get webhook subscription details by ID',
    description: 'Returns full configuration of a single webhook subscription including subscribed events and secret.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the webhook subscription' })
  @ApiResponse({ status: 200, description: 'Webhook subscription details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Webhook subscription not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  findOneWebhookSubscription(@Param('id') id: string) {
    return this.communicationsService.findOneWebhookSubscription(id);
  }

  @Patch('webhooks/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a webhook subscription',
    description: 'Partially updates a webhook subscription\'s URL, events, secret, or active status.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the webhook subscription' })
  @ApiResponse({ status: 200, description: 'Webhook subscription updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Webhook subscription not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  updateWebhookSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookSubscriptionDto,
  ) {
    return this.communicationsService.updateWebhookSubscription(id, dto);
  }

  @Delete('webhooks/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a webhook subscription (soft delete)',
    description: 'Soft-deletes the webhook subscription. It will no longer receive event notifications.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the webhook subscription' })
  @ApiResponse({ status: 200, description: 'Webhook subscription deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Webhook subscription not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  removeWebhookSubscription(@Param('id') id: string) {
    return this.communicationsService.removeWebhookSubscription(id);
  }

  // 5. Programmatic Brevo Webhook Management
  @Post('providers/brevo/webhook')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Register a webhook endpoint with Brevo',
    description: 'Programmatically registers a public URL with Brevo to receive transactional email event callbacks (delivered, opened, bounced, etc.).',
  })
  @ApiResponse({ status: 201, description: 'Webhook registered with Brevo' })
  @ApiResponse({ status: 400, description: 'Invalid URL' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  registerBrevoWebhook(@Body() dto: RegisterBrevoWebhookDto) {
    return this.communicationsService.registerBrevoWebhook(dto.url);
  }

  @Delete('providers/brevo/webhook')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Unregister the webhook endpoint from Brevo',
    description: 'Removes the previously registered webhook URL from Brevo. Brevo will stop sending event callbacks.',
  })
  @ApiResponse({ status: 200, description: 'Webhook unregistered from Brevo' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  unregisterBrevoWebhook() {
    return this.communicationsService.unregisterBrevoWebhook();
  }

  @Get('providers/brevo/senders')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'List all Brevo registered senders',
    description: 'Fetches all verified sender email addresses and names from the connected Brevo account.',
  })
  @ApiResponse({ status: 200, description: 'List of Brevo senders' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  getBrevoSenders() {
    return this.communicationsService.getBrevoSenders();
  }

  @Post('providers/brevo/senders')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Register a new sender identity with Brevo',
    description: 'Creates a new sender email/name pair on Brevo. The sender may need to verify ownership via email before use.',
  })
  @ApiResponse({ status: 201, description: 'Sender created on Brevo' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  createBrevoSender(@Body() dto: CreateBrevoSenderDto) {
    return this.communicationsService.createBrevoSender(dto);
  }

  @Delete('providers/brevo/senders/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a Brevo sender identity',
    description: 'Removes a registered sender from the Brevo account by its numeric Brevo sender ID.',
  })
  @ApiParam({ name: 'id', description: 'Brevo numeric sender ID' })
  @ApiResponse({ status: 200, description: 'Sender deleted from Brevo' })
  @ApiResponse({ status: 400, description: 'Sender ID must be numeric' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
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
    summary: 'List all registered system events for mapping',
    description: 'Returns all application events grouped by category, along with their payload registry. Used for building event-template mappings.',
  })
  @ApiResponse({ status: 200, description: 'Categorised system events with payload registry' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
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
  @ApiOperation({
    summary: 'List all event-template mappings',
    description: 'Returns all configured event-to-template mappings that define which templates are triggered by which system events.',
  })
  @ApiResponse({ status: 200, description: 'List of event-template mappings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  findAllEventMappings() {
    return this.communicationsService.findAllEventMappings();
  }

  @Post('event-mappings')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new event-template mapping',
    description: 'Maps a system event to one or more message templates with trigger configuration (recipient path, CC, BCC, sender overrides).',
  })
  @ApiResponse({ status: 201, description: 'Event mapping created' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  createEventMapping(@Body() dto: CreateEventTemplateMappingDto) {
    return this.communicationsService.createEventMapping(dto);
  }

  @Patch('event-mappings/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Update an event-template mapping',
    description: 'Partially updates an event mapping\'s triggers, recipient paths, or active status.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the event-template mapping' })
  @ApiResponse({ status: 200, description: 'Event mapping updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event mapping not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  updateEventMapping(
    @Param('id') id: string,
    @Body() dto: UpdateEventTemplateMappingDto,
  ) {
    return this.communicationsService.updateEventMapping(id, dto);
  }

  @Delete('event-mappings/:id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete an event-template mapping (soft delete)',
    description: 'Soft-deletes the mapping. The system event will no longer trigger communications via this mapping.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the event-template mapping' })
  @ApiResponse({ status: 200, description: 'Event mapping deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event mapping not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  removeEventMapping(@Param('id') id: string) {
    return this.communicationsService.deleteEventMapping(id);
  }
}

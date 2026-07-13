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
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import { CommunicationVariablesService } from './services/communication-variables.service';
import {
  CreateCommunicationVariableDto,
  UpdateCommunicationVariableDto,
  QueryCommunicationVariableDto,
} from './dto/communication-variable.dto';

@ApiTags('Admin | Communication Variables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemUserRole.SUPER_ADMIN)
@Controller('admin/communications/variables')
export class AdminCommunicationVariablesController {
  constructor(
    private readonly variablesService: CommunicationVariablesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new communication variable',
    description:
      'Registers a new dynamic template variable that can be used in communication templates. ' +
      'Variables are scoped to a modelName (e.g. Registree, Nomination) and a categoryGroup. ' +
      'The path must be unique within its modelName classification.',
  })
  @ApiResponse({ status: 201, description: 'Variable created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body or validation failure' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid JWT' })
  @ApiResponse({
    status: 409,
    description: 'Conflict — variable with same modelName + path already exists',
  })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  create(@Body() createDto: CreateCommunicationVariableDto) {
    return this.variablesService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all communication variables with pagination and filters',
    description:
      'Returns a paginated list of communication variables. Supports filtering by ' +
      'modelName, categoryGroup, active status, and sender variable compatibility. ' +
      'Search performs a case-insensitive match across name, path, and description fields.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term across name, path, and description' })
  @ApiQuery({ name: 'modelName', required: false, type: String, description: 'Filter by base schema model (e.g. Registree, Nomination, Event)' })
  @ApiQuery({ name: 'categoryGroup', required: false, type: String, description: 'Filter by category group enum (REGISTRATION, NOMINATION, EVENT, BLOG, CONTACT, WEBSITE)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active/inactive status' })
  @ApiQuery({ name: 'isSenderVariable', required: false, type: Boolean, description: 'Filter variables compatible for sender/recipient address mapping' })
  @ApiResponse({ status: 200, description: 'Paginated list of communication variables' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  findAll(@Query() queryDto: QueryCommunicationVariableDto) {
    return this.variablesService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get communication variable by ID',
    description: 'Returns the full details of a single communication variable by its MongoDB ID.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the communication variable' })
  @ApiResponse({ status: 200, description: 'Communication variable details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Variable not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  findOne(@Param('id') id: string) {
    return this.variablesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing communication variable',
    description:
      'Partially updates a communication variable. Only the fields provided in the body will be updated. ' +
      'Updating the path or modelName may affect existing template mappings.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the communication variable' })
  @ApiResponse({ status: 200, description: 'Variable updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Variable not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCommunicationVariableDto,
  ) {
    return this.variablesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a communication variable (soft delete)',
    description:
      'Soft-deletes the communication variable. The record is marked as deleted but remains in the database. ' +
      'Deleted variables will no longer appear in template variable selectors.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the communication variable' })
  @ApiResponse({ status: 200, description: 'Variable deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Variable not found' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  remove(@Param('id') id: string) {
    return this.variablesService.remove(id);
  }
}

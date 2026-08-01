import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AttendeesService } from './attendees.service';
import {
  CreateCxoNetworkMemberDto,
  QueryCxoNetworkDto,
} from './dto/cxo-network.dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { SystemUserRole } from '@common/enums/role.enum';

@ApiTags('Admin | CXO Capital Network')
@Controller('admin/cxo-network')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
export class AdminCxoNetworkController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Get()
  @Permission('registrations.view')
  @ApiOperation({
    summary: 'Get all CXO Capital Network members',
    description:
      'Retrieves a paginated list of CXO Capital Network application submissions with support for searching by name, email, designation, or company, and filtering by category or website ID.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for name, email, company, or designation',
  })
  @ApiQuery({
    name: 'companyCategory',
    required: false,
    type: String,
    description: 'Filter by category (Enterprise, Startup, Government, Education, Other)',
  })
  @ApiQuery({
    name: 'websiteId',
    required: false,
    type: String,
    description: 'Filter by website ObjectId',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved CXO network members.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized request.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden resource - requires registrations.view permission.',
  })
  findAll(@Query() query: QueryCxoNetworkDto) {
    return this.attendeesService.findAllCxoNetworkMembers(query);
  }

  @Post()
  @Permission('registrations.create')
  @ApiOperation({
    summary: 'Manually add a CXO Capital Network member',
    description:
      'Allows administrators to manually add a new CXO Capital Network member into the database.',
  })
  @ApiBody({ type: CreateCxoNetworkMemberDto })
  @ApiResponse({
    status: 201,
    description: 'Member created successfully and linked to registree record.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized request.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden resource - requires registrations.create permission.',
  })
  create(@Body() dto: CreateCxoNetworkMemberDto) {
    return this.attendeesService.createCxoNetworkMember(dto, dto.websiteId);
  }

  @Delete(':id')
  @Permission('registrations.delete')
  @ApiOperation({
    summary: 'Delete a CXO Capital Network member',
    description: 'Soft deletes a CXO Capital Network member by ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the CXO network member.',
  })
  @ApiResponse({ status: 200, description: 'Member deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Member not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized request.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden resource - requires registrations.delete permission.',
  })
  remove(@Param('id') id: string) {
    return this.attendeesService.removeCxoNetworkMember(id);
  }
}

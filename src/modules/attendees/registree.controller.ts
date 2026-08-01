import {
  Controller,
  Get,
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
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AttendeesService } from './attendees.service';
import { UpdateRegistreeDto, QueryRegistreeDto } from './dto/registree.dto';
import { QueryCxoNetworkDto } from './dto/cxo-network.dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { SystemUserRole } from '@common/enums/role.enum';

@ApiTags('Admin | Registrees')
@Controller('admin/registrees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
export class AdminRegistreesController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Get()
  @Permission('registrations.view')
  @ApiOperation({
    summary: 'Get all global registrees (contacts) across all events',
    description:
      'Fetches paginated search results for CRM contacts with full historical events and submissions lists.',
  })
  findAll(@Query() query: QueryRegistreeDto) {
    return this.attendeesService.findAllRegistrees(query);
  }

  @Get(':id')
  @Permission('registrations.view')
  @ApiOperation({ summary: 'Get details of a single global registree by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the Registree.' })
  findOne(@Param('id') id: string) {
    return this.attendeesService.findOneRegistree(id);
  }

  @Patch(':id')
  @Permission('registrations.update')
  @ApiOperation({ summary: 'Update global contact details of a registree' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the Registree.' })
  update(@Param('id') id: string, @Body() updateDto: UpdateRegistreeDto) {
    return this.attendeesService.updateRegistree(id, updateDto);
  }

  @Delete(':id')
  @Permission('registrations.delete')
  @ApiOperation({ summary: 'Delete a global registree contact' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the Registree.' })
  remove(@Param('id') id: string) {
    return this.attendeesService.removeRegistree(id);
  }

  @Patch(':id/registrations/:eventId/approve')
  @Permission('registrations.update')
  @ApiOperation({ summary: 'Approve a registree event registration' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the Registree.' })
  @ApiParam({ name: 'eventId', description: 'MongoDB ID of the Event.' })
  approve(@Param('id') id: string, @Param('eventId') eventId: string) {
    return this.attendeesService.approveRegistration(id, eventId);
  }

  @Patch(':id/registrations/:eventId/reject')
  @Permission('registrations.update')
  @ApiOperation({ summary: 'Reject a registree event registration' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the Registree.' })
  @ApiParam({ name: 'eventId', description: 'MongoDB ID of the Event.' })
  reject(@Param('id') id: string, @Param('eventId') eventId: string) {
    return this.attendeesService.rejectRegistration(id, eventId);
  }

  @Patch(':id/registrations/:eventId/block')
  @Permission('registrations.update')
  @ApiOperation({ summary: 'Block a registree event registration' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the Registree.' })
  @ApiParam({ name: 'eventId', description: 'MongoDB ID of the Event.' })
  block(@Param('id') id: string, @Param('eventId') eventId: string) {
    return this.attendeesService.blockRegistration(id, eventId);
  }

  @Get('cxo-network/list')
  @Permission('registrations.view')
  @ApiOperation({
    summary: 'Get all CXO Capital Network members for website dashboard',
    description:
      'Retrieves a paginated list of CXO Capital Network application submissions with options to search by name, email, designation, or company, and filter by category or website ID.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for name, email, company, or designation' })
  @ApiQuery({ name: 'companyCategory', required: false, type: String, description: 'Filter by category (Enterprise, Startup, Government, Education, Other)' })
  @ApiQuery({ name: 'websiteId', required: false, type: String, description: 'Filter by associated website ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved CXO network members.' })
  @ApiResponse({ status: 401, description: 'Unauthorized request.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource - requires registrations.view permission.' })
  findAllCxoNetwork(@Query() query: QueryCxoNetworkDto) {
    return this.attendeesService.findAllCxoNetworkMembers(query);
  }

  @Delete('cxo-network/:id')
  @Permission('registrations.delete')
  @ApiOperation({
    summary: 'Delete a CXO Capital Network member',
    description: 'Soft deletes a CXO Capital Network member entry by MongoDB ID.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the member.' })
  @ApiResponse({ status: 200, description: 'Member deleted successfully.' })
  @ApiResponse({ status: 404, description: 'CXO Network Member not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized request.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource - requires registrations.delete permission.' })
  removeCxoNetwork(@Param('id') id: string) {
    return this.attendeesService.removeCxoNetworkMember(id);
  }
}

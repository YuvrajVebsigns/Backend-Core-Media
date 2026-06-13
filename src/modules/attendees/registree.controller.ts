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
  ApiResponse,
} from '@nestjs/swagger';
import { AttendeesService } from './attendees.service';
import { UpdateRegistreeDto, QueryRegistreeDto } from './dto/registree.dto';
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
    description: 'Fetches paginated search results for CRM contacts with full historical events and submissions lists.',
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
}

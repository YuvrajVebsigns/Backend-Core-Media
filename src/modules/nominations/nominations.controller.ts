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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import { NominationsService } from './nominations.service';
import { NominationExportService } from './nomination-export.service';
import {
  CreateNominationDto,
  UpdateNominationDto,
  UpdateNominationStatusDto,
  UpdateWebsiteNominationStatusDto,
  QueryNominationDto,
  QueryNominationExportDto,
} from './dto/nomination.dto';

@ApiTags('Admin | Nominations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Controller('admin/nominations')
export class AdminNominationsController {
  constructor(
    private readonly nominationsService: NominationsService,
    private readonly nominationExportService: NominationExportService,
  ) {}

  @Post()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('nominators.create', 'nominees.create', 'nominations.create')
  @ApiOperation({
    summary: 'Create a nomination (Admin)',
    description:
      'Manually create a nomination entry. Creates/updates registrees for both the nominator and all nominees.',
  })
  @ApiResponse({ status: 201, description: 'Nomination created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Max 10 nominees per request exceeded',
  })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  create(@Body() createDto: CreateNominationDto) {
    return this.nominationsService.create(createDto);
  }

  @Get()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @Permission('nominators.view', 'nominees.view', 'nominations.view')
  @ApiOperation({
    summary: 'Get all nominations with pagination and filters',
    description:
      'Retrieve nominations with populated nominator and nominee registree details.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of nominations' })
  findAll(@Query() query: QueryNominationDto) {
    return this.nominationsService.findAll(query);
  }

  @Get('grouped/nominators')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @Permission('nominators.view', 'nominations.view')
  @ApiOperation({
    summary: 'Get all unique nominators with aggregated nominations',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of grouped nominators',
  })
  findAllGroupedByNominator(@Query() query: QueryNominationDto) {
    return this.nominationsService.findAllGroupedByNominator(query);
  }

  @Get('grouped/nominees')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @Permission('nominees.view', 'nominations.view')
  @ApiOperation({
    summary: 'Get all unique nominees with aggregated nominations',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of grouped nominees',
  })
  findAllGroupedByNominee(@Query() query: QueryNominationDto) {
    return this.nominationsService.findAllGroupedByNominee(query);
  }

  @Get('export/nominees')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @Permission('nominees.export', 'nominations.export')
  @ApiOperation({
    summary: 'Export nominees with voting data & analytics as Excel',
    description:
      'Generates a styled Excel workbook containing analytics KPI metrics, nominee directory with live Excel formulas, and detailed submission audit logs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel spreadsheet file (.xlsx) stream',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async exportNominees(
    @Query() query: QueryNominationExportDto,
    @Res() res: Response,
  ) {
    const buffer = await this.nominationExportService.exportNominees(query);
    const filename = `nominees-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.byteLength.toString());
    res.end(buffer);
  }

  @Get('export/nominators')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @Permission('nominators.export', 'nominations.export')
  @ApiOperation({
    summary: 'Export nominators with voting & submission data as Excel',
    description:
      'Generates a styled Excel workbook containing nominator activity analytics, nominator directory with live Excel formulas, and detailed submission audit logs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel spreadsheet file (.xlsx) stream',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async exportNominators(
    @Query() query: QueryNominationExportDto,
    @Res() res: Response,
  ) {
    const buffer = await this.nominationExportService.exportNominators(query);
    const filename = `nominators-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.byteLength.toString());
    res.end(buffer);
  }

  @Get(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @Permission('nominators.view', 'nominees.view', 'nominations.view')
  @ApiOperation({ summary: 'Get a nomination by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the nomination' })
  @ApiResponse({
    status: 200,
    description: 'Nomination details with populated registrees',
  })
  @ApiResponse({ status: 404, description: 'Nomination not found' })
  findOne(@Param('id') id: string) {
    return this.nominationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('nominators.update', 'nominees.update', 'nominations.update')
  @ApiOperation({ summary: 'Update a nomination' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the nomination' })
  @ApiResponse({ status: 200, description: 'Nomination updated successfully' })
  @ApiResponse({ status: 404, description: 'Nomination not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateNominationDto) {
    return this.nominationsService.update(id, updateDto);
  }

  @Patch('websites/:websiteId/nomination-status')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('nominators.update', 'nominees.update', 'nominations.update')
  @ApiOperation({ summary: 'Update website nomination form status' })
  @ApiParam({ name: 'websiteId', description: 'MongoDB ID of the website' })
  @ApiResponse({
    status: 200,
    description: 'Website nomination form status updated',
  })
  @ApiResponse({ status: 404, description: 'Website not found' })
  updateWebsiteNominationStatus(
    @Param('websiteId') websiteId: string,
    @Body() updateWebsiteNominationStatusDto: UpdateWebsiteNominationStatusDto,
  ) {
    return this.nominationsService.updateWebsiteNominationStatus(
      websiteId,
      updateWebsiteNominationStatusDto.isActive,
    );
  }

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN)
  @Permission('nominators.delete', 'nominees.delete', 'nominations.delete')
  @ApiOperation({ summary: 'Soft delete a nomination' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the nomination' })
  @ApiResponse({ status: 200, description: 'Nomination deleted successfully' })
  @ApiResponse({ status: 404, description: 'Nomination not found' })
  remove(@Param('id') id: string) {
    return this.nominationsService.remove(id);
  }
}

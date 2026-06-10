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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import { ReportsService } from './reports.service';
import {
  CreateReportDto,
  UpdateReportDto,
  QueryReportDto,
} from './dto/report.dto';

@ApiTags('Admin | Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/website/reports')
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  async create(@Body() createDto: CreateReportDto, @Request() req: any) {
    return this.reportsService.create(createDto, req.user.id);
  }

  @Get()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'List reports with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Reports list' })
  async findAll(@Query() query: QueryReportDto) {
    return this.reportsService.findAll(query);
  }

  @Get(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({ status: 200, description: 'Report details' })
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Update report details' })
  @ApiResponse({ status: 200, description: 'Report updated' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateReportDto,
    @Request() req: any,
  ) {
    return this.reportsService.update(id, updateDto, req.user.id);
  }

  @Get(':id/downloaders')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Get list of users who downloaded the report' })
  @ApiResponse({ status: 200, description: 'Downloaders list' })
  async findDownloaders(@Param('id') id: string) {
    return this.reportsService.findDownloaders(id);
  }

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a report' })
  @ApiResponse({ status: 200, description: 'Report deleted' })
  async remove(@Param('id') id: string) {
    await this.reportsService.remove(id);
    return { message: 'Report deleted successfully' };
  }
}


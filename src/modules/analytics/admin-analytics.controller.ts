import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AnalyticsSummaryResponseDto } from './dto/analytics-summary-response.dto';

@ApiTags('Admin | Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':websiteId/summary')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Get aggregated visitor analytics summary for a website' })
  @ApiParam({ name: 'websiteId', type: String, description: 'Website database ID' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully', type: AnalyticsSummaryResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSummary(
    @Param('websiteId') websiteId: string,
    @Query() queryDto: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getSummary(websiteId, queryDto);
  }
}

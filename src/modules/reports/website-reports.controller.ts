import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';
import { ReportsService } from './reports.service';
import { DownloadReportDto, QueryReportDto } from './dto/report.dto';

@ApiTags('Website | Reports')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteAuthGuard)
@Throttle({
  short: { ttl: 1000, limit: 2 },
  medium: { ttl: 60000, limit: 10 },
  long: { ttl: 3600000, limit: 100 },
})
@Controller('website/reports')
export class WebsiteReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'List published reports for the authenticated website',
  })
  @ApiResponse({ status: 200, description: 'Reports list' })
  async findAll(@CurrentWebsite() website: any, @Query() query: QueryReportDto) {
    const siteId = website.id || website._id;
    return this.reportsService.findAll({
      ...query,
      websiteId: siteId.toString(),
      isPublished: 'true',
    });
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get published report details by slug',
  })
  @ApiResponse({ status: 200, description: 'Report details' })
  async findBySlug(@Param('slug') slug: string) {
    return this.reportsService.findBySlug(slug);
  }

  @Post('download')
  @ApiOperation({
    summary: 'Submit the report download form, track user as a registree, and generate download link',
  })
  @ApiResponse({ status: 201, description: 'Form submitted and download link generated successfully' })
  async downloadReport(
    @CurrentWebsite() website: any,
    @Body() downloadDto: DownloadReportDto,
  ) {
    const siteId = website.id || website._id;
    return this.reportsService.downloadReport(downloadDto, siteId.toString());
  }
}

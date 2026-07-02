import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SponsorsService } from './sponsors.service';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Website | Sponsors')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteAuthGuard)
@Throttle({
  short: { ttl: 1000, limit: 30 },
  medium: { ttl: 60000, limit: 300 },
  long: { ttl: 3600000, limit: 10000 },
})
@Controller('website/sponsors')
export class WebsiteSponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all active sponsors for this website',
    description:
      'Returns a paginated list of active sponsors associated with the authenticated website.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit items per page',
  })
  @ApiQuery({
    name: 'tier',
    required: false,
    type: String,
    description:
      'Filter by sponsor tier (Platinum, Gold, Silver, Bronze, Partner)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Filter by sponsor type (Individual, Company, CompanyUnit)',
  })
  async findAll(
    @CurrentWebsite() website: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tier') tier?: string,
    @Query('type') type?: string,
  ) {
    return this.sponsorsService.findAllForWebsite({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      isActive: true,
      websiteId: website.id,
      tier: tier as any,
      type: type as any,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific sponsor by ID' })
  async findOne(@CurrentWebsite() website: any, @Param('id') id: string) {
    const sponsor = await this.sponsorsService.findOne(id);

    // Verify the sponsor belongs to this website
    const sponsorWebsites = (sponsor.websites || []).map((w: any) =>
      typeof w === 'string' ? w : w.id || w._id?.toString(),
    );

    if (!sponsorWebsites.includes(website.id)) {
      throw new NotFoundException('Sponsor not found for this website');
    }

    return sponsor;
  }
}

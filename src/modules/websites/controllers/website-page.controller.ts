import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';
import { WebsitePageService } from '../services/website-page.service';

@ApiTags('Website | Pages')
@Controller('website/pages')
export class WebsitePageController {
  constructor(private readonly pageService: WebsitePageService) {}

  // ----------------------------------------------------
  // PUBLIC WEBSITE ENDPOINTS
  // ----------------------------------------------------

  @Get()
  @UseGuards(WebsiteAuthGuard)
  @ApiBearerAuth('website-token')
  @ApiOperation({
    summary:
      'List all available pages with small details for the authenticated website',
  })
  async findAll(@CurrentWebsite() website: any) {
    return this.pageService.findAllForWebsite(website.id);
  }

  @Get(':slug')
  @UseGuards(WebsiteAuthGuard)
  @ApiBearerAuth('website-token')
  @ApiOperation({
    summary: 'Get page by slug for the authenticated website',
  })
  async findBySlug(
    @CurrentWebsite() website: any,
    @Param('slug') slug: string,
  ) {
    return this.pageService.findBySlugForWebsite(website.id, slug);
  }
}

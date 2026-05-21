import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { WebsitesService } from './websites.service';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';

@ApiTags('Website | Websites')
@Controller('website')
export class WebsiteWebsitesController {
  constructor(private readonly websitesService: WebsitesService) {}

  @Post('token')
  @ApiOperation({
    summary: 'Get website verification JWT token',
    description:
      'Generates a temporary website token after validating the request Origin header. Supports passing target domain in query/body/header for local development.',
  })
  @ApiHeader({
    name: 'origin',
    required: false,
    description: 'Client browser origin',
  })
  @ApiHeader({
    name: 'x-website-domain',
    required: false,
    description: 'Target domain fallback for local dev',
  })
  @ApiQuery({
    name: 'domain',
    required: false,
    description: 'Target domain fallback for local dev',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Target domain fallback for local dev',
        },
      },
    },
    required: false,
  })
  async getWebsiteToken(
    @Req() req: any,
    @Headers('origin') originHeader?: string,
    @Headers('referer') refererHeader?: string,
    @Headers('x-website-domain') customDomainHeader?: string,
    @Query('domain') customDomainQuery?: string,
    @Body('domain') customDomainBody?: string,
  ) {
    const origin = originHeader || refererHeader || '';
    const fallbackDomain =
      customDomainHeader || customDomainQuery || customDomainBody;

    return this.websitesService.generateWebsiteToken(origin, fallbackDomain);
  }

  @Get('websites/settings')
  @UseGuards(WebsiteAuthGuard)
  @ApiBearerAuth('website-token')
  @ApiOperation({
    summary: 'Get website settings',
    description:
      'Returns the settings, logo, SEO details and configuration of the authenticated website.',
  })
  async getSettings(@CurrentWebsite() website: any) {
    return this.websitesService.findOne(website.id);
  }
}

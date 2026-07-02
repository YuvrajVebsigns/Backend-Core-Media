import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';
import { NominationsService } from './nominations.service';
import { NominationCategoriesService } from './nomination-categories.service';
import { CreateNominationDto } from './dto/nomination.dto';

@ApiTags('Website | Nominations')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteAuthGuard)
@Throttle({
  short: { ttl: 1000, limit: 2 },
  medium: { ttl: 60000, limit: 5 },
  long: { ttl: 3600000, limit: 50 },
})
@Controller('website/nominations')
export class WebsiteNominationsController {
  constructor(
    private readonly nominationsService: NominationsService,
    private readonly categoriesService: NominationCategoriesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Submit a CIO nomination form from a website',
    description:
      'A nominator submits their details along with up to 10 CIO nominees. ' +
      'Creates/updates registree records for both the nominator and each nominee. ' +
      'Enforces a max of 10 nominees per nominator email across all submissions.',
  })
  @ApiResponse({
    status: 201,
    description: 'Nomination submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or max nominees exceeded',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized website token' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  create(
    @CurrentWebsite() website: any,
    @Body() createDto: CreateNominationDto,
  ) {
    return this.nominationsService.create(createDto, website?.id);
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Get all active nomination categories for dropdown',
    description:
      'Returns only active categories sorted by sort order, for populating the CIO category dropdown.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active nomination categories',
  })
  getCategories() {
    return this.categoriesService.findAllActive();
  }
}

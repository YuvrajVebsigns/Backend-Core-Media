import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';
import { NavbarService } from '../services/navbar.service';

@ApiTags('Website | Navbar')
@Controller('website/navbar')
export class NavbarController {
  constructor(private readonly navbarService: NavbarService) { }

  @Get()
  @UseGuards(WebsiteAuthGuard)
  @ApiBearerAuth('website-token')
  @ApiOperation({
    summary: 'Get active navbar items for public website',
  })
  async findAll(
    @CurrentWebsite() website: any,
    @Query('position') position?: string,
    @Query('nested') nested?: string,
  ) {
    return this.navbarService.findAll(
      website.id,
      position,
      nested !== 'false',
    );
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';
import { NavbarService } from '../services/navbar.service';
import { NavbarPosition } from '../enums/navbar-position.enum';

@ApiTags('Website | Navbar')
@Controller('website/navbar')
export class NavbarController {
  constructor(private readonly navbarService: NavbarService) {}

  @Get()
  @UseGuards(WebsiteAuthGuard)
  @ApiBearerAuth('website-token')
  @ApiOperation({
    summary: 'Get active navbar items for public website',
  })
  @ApiQuery({
    name: 'position',
    enum: NavbarPosition,
    required: true,
    description: 'Navbar position',
  })
  @ApiQuery({
    name: 'nested',
    required: false,
    type: String,
    description: 'Whether to return nested items structure ("true" or "false")',
    default: 'true',
  })
  async findAll(
    @CurrentWebsite() website: any,
    @Query('position') position: NavbarPosition,
    @Query('nested') nested?: string,
  ) {
    return this.navbarService.findAll(website.id, position, nested !== 'false', true);
  }
}


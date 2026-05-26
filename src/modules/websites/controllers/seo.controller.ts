import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import { WebsitePageService } from '../services/website-page.service';
import { UpdateSeoDto } from '../dto/update-seo.dto';

@ApiTags('Website | SEO')
@Controller('website/pages')
export class SeoController {
  constructor(private readonly pageService: WebsitePageService) {}

  @Patch(':id/seo')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.manage_seo')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update SEO metadata for a page' })
  async updateSeo(
    @Param('id') id: string,
    @Body() updateSeoDto: UpdateSeoDto,
    @Request() req: any,
  ) {
    return this.pageService.update(id, { seo: updateSeoDto.seo }, req.user.id);
  }
}

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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';
import { WebsitePageService } from '../services/website-page.service';
import { CreatePageDto, QueryPageDto } from '../dto/create-page.dto';
import { UpdatePageDto } from '../dto/update-page.dto';

@ApiTags('Website | Pages')
@Controller('website/pages')
export class WebsitePageController {
  constructor(private readonly pageService: WebsitePageService) {}

  // ----------------------------------------------------
  // PUBLIC WEBSITE ENDPOINTS
  // ----------------------------------------------------

  @Get(':slug')
  @UseGuards(WebsiteAuthGuard)
  @ApiBearerAuth('website-token')
  @ApiOperation({
    summary: 'Get published page by slug for the authenticated website',
  })
  async findBySlug(@CurrentWebsite() website: any, @Param('slug') slug: string) {
    return this.pageService.findBySlug(website.id, slug);
  }

  // ----------------------------------------------------
  // ADMIN CMS ENDPOINTS
  // ----------------------------------------------------

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN)
  @Permission('website.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new website page' })
  async create(@Body() createDto: CreatePageDto, @Request() req: any) {
    return this.pageService.create(createDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List website pages (paginated, filtered)' })
  async findAll(@Query() queryDto: QueryPageDto) {
    return this.pageService.findAll(queryDto);
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get website page by ID' })
  async findOne(@Param('id') id: string) {
    return this.pageService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a website page' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePageDto,
    @Request() req: any,
  ) {
    const isSuperAdmin = req.user?.role?.roleKey === SystemUserRole.SUPER_ADMIN;
    if (!isSuperAdmin) {
      delete updateDto.content;
      delete updateDto.sections;
    }
    return this.pageService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN)
  @Permission('website.delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a website page' })
  async remove(@Param('id') id: string) {
    await this.pageService.remove(id);
    return { success: true };
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN)
  @Permission('website.publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a website page' })
  async publish(@Param('id') id: string, @Request() req: any) {
    return this.pageService.publish(id, req.user.id);
  }

  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN)
  @Permission('website.publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpublish a website page (set to DRAFT)' })
  async unpublish(@Param('id') id: string, @Request() req: any) {
    return this.pageService.unpublish(id, req.user.id);
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN)
  @Permission('website.create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Duplicate an existing website page' })
  async duplicate(@Param('id') id: string, @Request() req: any) {
    return this.pageService.duplicate(id, req.user.id);
  }

  @Post(':id/preview')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Preview website page (bypass cache lookup)' })
  async preview(@Param('id') id: string) {
    const page = await this.pageService.findOne(id);
    return this.pageService.findBySlug(page.siteId.toString(), page.slug, true);
  }
}

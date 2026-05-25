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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import { JwtService } from '@nestjs/jwt';
import { NavbarService } from '../services/navbar.service';
import { CreateNavbarItemDto } from '../dto/create-navbar-item.dto';
import { UpdateNavbarItemDto } from '../dto/update-navbar-item.dto';
import { ReorderNavbarDto } from '../dto/reorder-navbar.dto';

@ApiTags('Website | Navbar')
@Controller('website/navbar')
export class NavbarController {
  constructor(
    private readonly navbarService: NavbarService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.manage_navbar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new navbar item' })
  async create(@Body() createDto: CreateNavbarItemDto, @Request() req: any) {
    return this.navbarService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get navbar items (Public Website / Admin CMS)',
    description:
      'If authorization header contains a website token, returns active nested menu items. If admin token, returns list of navbars (requires siteId query param).',
  })
  async findAll(
    @Request() req: any,
    @Query('siteId') siteId?: string,
    @Query('position') position?: string,
    @Query('nested') nested?: string,
  ) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = this.jwtService.verify(token);
        if (decoded.type === 'website') {
          return this.navbarService.findAll(
            decoded.websiteId,
            position,
            nested !== 'false',
          );
        }
      } catch (e) {
        // Continue to admin logic
      }
    }

    if (!siteId) {
      throw new BadRequestException('siteId query parameter is required for admin requests');
    }

    return this.navbarService.findAll(siteId, position, nested === 'true');
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.manage_navbar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder navbar items' })
  async reorder(@Body() reorderDto: ReorderNavbarDto) {
    await this.navbarService.reorder(reorderDto);
    return { success: true };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.manage_navbar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get navbar item details' })
  async findOne(@Param('id') id: string) {
    return this.navbarService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.manage_navbar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a navbar item' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNavbarItemDto,
    @Request() req: any,
  ) {
    return this.navbarService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.manage_navbar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a navbar item' })
  async remove(@Param('id') id: string) {
    await this.navbarService.remove(id);
    return { success: true };
  }
}

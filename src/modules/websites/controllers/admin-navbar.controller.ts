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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import { NavbarService } from '../services/navbar.service';
import { CreateNavbarItemDto } from '../dto/create-navbar-item.dto';
import { UpdateNavbarItemDto } from '../dto/update-navbar-item.dto';
import { ReorderNavbarDto } from '../dto/reorder-navbar.dto';
import { NavbarPosition } from '../enums/navbar-position.enum';

@ApiTags('Admin | Website Navbar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Controller('admin/website/navbar')
export class AdminNavbarController {
  constructor(private readonly navbarService: NavbarService) {}

  @Post()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.manage_navbar')
  @ApiOperation({ summary: 'Create a new navbar item' })
  async create(@Body() createDto: CreateNavbarItemDto, @Request() req: any) {
    return this.navbarService.create(createDto, req.user.id);
  }

  @Get()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.manage_navbar')
  @ApiOperation({ summary: 'List all navbar items for a site' })
  @ApiQuery({
    name: 'siteId',
    required: true,
    type: String,
    description: 'Website/Site ID',
  })
  @ApiQuery({
    name: 'position',
    enum: NavbarPosition,
    required: false,
    description: 'Navbar position filter',
  })
  @ApiQuery({
    name: 'nested',
    required: false,
    type: String,
    description: 'Whether to return nested items structure ("true" or "false")',
    default: 'false',
  })
  async findAll(
    @Query('siteId') siteId: string,
    @Query('position') position?: NavbarPosition,
    @Query('nested') nested?: string,
  ) {
    if (!siteId) {
      throw new BadRequestException('siteId query parameter is required');
    }
    return this.navbarService.findAll(siteId, position, nested === 'true');
  }

  @Patch('reorder')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.manage_navbar')
  @ApiOperation({ summary: 'Reorder navbar items' })
  async reorder(@Body() reorderDto: ReorderNavbarDto) {
    await this.navbarService.reorder(reorderDto);
    return { success: true };
  }

  @Get(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.manage_navbar')
  @ApiOperation({ summary: 'Get navbar item details' })
  async findOne(@Param('id') id: string) {
    return this.navbarService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.manage_navbar')
  @ApiOperation({ summary: 'Update a navbar item' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNavbarItemDto,
    @Request() req: any,
  ) {
    return this.navbarService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('website.manage_navbar')
  @ApiOperation({ summary: 'Delete a navbar item' })
  async remove(@Param('id') id: string) {
    await this.navbarService.remove(id);
    return { success: true };
  }
}

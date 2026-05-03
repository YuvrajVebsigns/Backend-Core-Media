import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SidebarMenuService } from './sidebar-menu.service';
import { CreateSidebarMenuDto } from './dto/create-sidebar-menu.dto';
import { UpdateSidebarMenuDto } from './dto/update-sidebar-menu.dto';
import { SidebarMenuResponseDto, PaginatedSidebarMenuResponseDto } from './dto/sidebar-menu-response.dto';
import { SidebarMenuPaginationQueryDto } from './dto/sidebar-menu-pagination-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';

import { SystemUserRole } from '../../common/enums/role.enum';

@ApiTags('Admin | SidebarMenus')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin/sidebar-menu')
export class SidebarMenuController {
  constructor(private readonly sidebarMenuService: SidebarMenuService) { }

  @Post()
  @Permission('sidebarMenu.create')
  @ApiOperation({ summary: 'Create a new sidebarMenu item' })
  @ApiStandardResponse({ status: 201, description: 'SidebarMenu created', type: SidebarMenuResponseDto })
  create(@Body() createSidebarMenuDto: CreateSidebarMenuDto) {
    return this.sidebarMenuService.createSidebarMenu(createSidebarMenuDto);
  }

  @Patch(':id')
  @Permission('sidebarMenu.update')
  @ApiOperation({ summary: 'Update a sidebarMenu item' })
  @ApiStandardResponse({ status: 200, description: 'SidebarMenu updated', type: SidebarMenuResponseDto })
  update(@Param('id') id: string, @Body() updateSidebarMenuDto: UpdateSidebarMenuDto) {
    return this.sidebarMenuService.updateSidebarMenu(id, updateSidebarMenuDto);
  }

  @Delete(':id')
  @Permission('sidebarMenu.delete')
  @ApiOperation({ summary: 'Delete a sidebarMenu item' })
  @ApiStandardResponse({ status: 200, description: 'SidebarMenu deleted' })
  remove(@Param('id') id: string) {
    return this.sidebarMenuService.deleteSidebarMenu(id);
  }

  @Get('all')
  @Permission('sidebarMenu.read_all')
  @ApiOperation({ summary: 'Get all sidebarMenus (paginated list for admin)' })
  @ApiStandardResponse({ status: 200, description: 'All sidebarMenus fetched', type: PaginatedSidebarMenuResponseDto, isArray: false })
  findAll(@Request() req: any, @Query() query: SidebarMenuPaginationQueryDto) {
    const roleName = req.user?.role?.name || 'unknown';
    const normalizedRole = roleName.toUpperCase().replace(/['"]/g, '');
    const isSuperAdmin = normalizedRole === SystemUserRole.SUPER_ADMIN;

    return this.sidebarMenuService.getAllSidebarMenus(isSuperAdmin, query);
  }

  @Get()
  @ApiOperation({ summary: 'Get sidebar sidebarMenus for the logged-in user' })
  @ApiStandardResponse({ status: 200, description: 'User sidebarMenus fetched' })
  async findUserSidebarMenus(@Request() req: any) {
    const user = req.user;
    const role = user?.role;
    const permissions = Array.isArray(role?.permissions) ? role.permissions : [];
    const roleName = role?.name || 'unknown';

    return this.sidebarMenuService.getUserSidebarMenus(permissions, roleName);
  }
}

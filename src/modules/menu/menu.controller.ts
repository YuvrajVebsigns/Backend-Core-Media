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
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuResponseDto, PaginatedMenuResponseDto } from './dto/menu-response.dto';
import { MenuPaginationQueryDto } from './dto/menu-pagination-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';

import { SystemUserRole } from '../../common/enums/role.enum';

@ApiTags('Admin | Menus')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin/menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) { }

  @Post()
  @Permission('menu.create')
  @ApiOperation({ summary: 'Create a new menu item' })
  @ApiStandardResponse({ status: 201, description: 'Menu created', type: MenuResponseDto })
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.createMenu(createMenuDto);
  }

  @Patch(':id')
  @Permission('menu.update')
  @ApiOperation({ summary: 'Update a menu item' })
  @ApiStandardResponse({ status: 200, description: 'Menu updated', type: MenuResponseDto })
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menuService.updateMenu(id, updateMenuDto);
  }

  @Delete(':id')
  @Permission('menu.delete')
  @ApiOperation({ summary: 'Delete a menu item' })
  @ApiStandardResponse({ status: 200, description: 'Menu deleted' })
  remove(@Param('id') id: string) {
    return this.menuService.deleteMenu(id);
  }

  @Get('all')
  @Permission('menu.read_all')
  @ApiOperation({ summary: 'Get all menus (paginated list for admin)' })
  @ApiStandardResponse({ status: 200, description: 'All menus fetched', type: PaginatedMenuResponseDto, isArray: false })
  findAll(@Request() req: any, @Query() query: MenuPaginationQueryDto) {
    const roleName = req.user?.role?.name || 'unknown';
    const normalizedRole = roleName.toUpperCase().replace(/['"]/g, '');
    const isSuperAdmin = normalizedRole === SystemUserRole.SUPER_ADMIN;

    return this.menuService.getAllMenus(isSuperAdmin, query);
  }

  @Get()
  @ApiOperation({ summary: 'Get sidebar menus for the logged-in user' })
  @ApiStandardResponse({ status: 200, description: 'User menus fetched' })
  async findUserMenus(@Request() req: any) {
    const user = req.user;
    const role = user?.role;
    const permissions = Array.isArray(role?.permissions) ? role.permissions : [];
    const roleName = role?.name || 'unknown';

    return this.menuService.getUserMenus(permissions, roleName);
  }
}

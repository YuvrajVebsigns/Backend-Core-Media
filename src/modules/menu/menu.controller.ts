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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';

@ApiTags('Admin | Menus')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('admin/menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @Permission('menu.create')
  @ApiOperation({ summary: 'Create a new menu item' })
  @ApiStandardResponse({ status: 201, description: 'Menu created' })
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menuService.createMenu(createMenuDto);
  }

  @Patch(':id')
  @Permission('menu.update')
  @ApiOperation({ summary: 'Update a menu item' })
  @ApiStandardResponse({ status: 200, description: 'Menu updated' })
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
  @ApiOperation({ summary: 'Get all menus (flat list for admin)' })
  @ApiStandardResponse({ status: 200, description: 'All menus fetched' })
  findAll() {
    return this.menuService.getAllMenus();
  }

  @Get()
  @ApiOperation({ summary: 'Get sidebar menus for the logged-in user' })
  @ApiStandardResponse({ status: 200, description: 'User menus fetched' })
  async findUserMenus(@Request() req: any) {
    const user = req.user;
    
    // Debug log to see user structure
    console.log('👤 Request User Role:', user?.role?.name);
    
    const role = user?.role;
    const permissions = Array.isArray(role?.permissions) ? role.permissions : [];
    const roleName = role?.name || 'unknown';
    
    console.log(`🔑 Extracted ${permissions.length} permissions for role: ${roleName}`);
    
    return this.menuService.getUserMenus(permissions, roleName);
  }
}

import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Menu } from './menu.schema';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuPaginationQueryDto } from './dto/menu-pagination-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { createPaginatedResponse } from '../../common/utils/pagination.util';

import { SystemUserRole } from '../../common/enums/role.enum';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Menu.name) private menuModel: Model<Menu>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  private async clearMenuCache() {
    const manager = this.cacheManager as any;
    try {
      if (manager.clear) await manager.clear();
      else if (manager.reset) await manager.reset();
      else if (manager.store?.clear) await manager.store.clear();
      else if (manager.store?.reset) await manager.store.reset();
    } catch (error) {
      console.warn('⚠️ Could not clear menu cache:', error.message);
    }
  }

  async createMenu(dto: CreateMenuDto): Promise<Menu> {
    if (dto.group) {
      dto.group = dto.group.toLowerCase();
    }
    // Check for duplicates
    const existing = await this.menuModel.findOne({
      $or: [
        { path: dto.path },
        { permissionKey: dto.permissionKey }
      ]
    });

    if (existing) {
      if (existing.path === dto.path) {
        throw new ConflictException(`Menu with path "${dto.path}" already exists`);
      }
      throw new ConflictException(`Menu with permission key "${dto.permissionKey}" already exists`);
    }

    if (dto.order === undefined || dto.order === null) {
      const lastMenu = await this.menuModel
        .findOne({ parentId: (dto.parentId as any) || null })
        .sort({ order: -1 })
        .exec();
      dto.order = lastMenu ? lastMenu.order + 1 : 0;
    }
    const newMenu = new this.menuModel(dto);
    const saved = await newMenu.save();
    await this.clearMenuCache();
    return saved;
  }

  async updateMenu(id: string, dto: UpdateMenuDto): Promise<Menu> {
    if (dto.group) {
      dto.group = dto.group.toLowerCase();
    }
    // Check for duplicates excluding current item
    if (dto.path || dto.permissionKey) {
      const existing = await this.menuModel.findOne({
        _id: { $ne: id },
        $or: [
          ...(dto.path ? [{ path: dto.path }] : []),
          ...(dto.permissionKey ? [{ permissionKey: dto.permissionKey }] : [])
        ]
      });

      if (existing) {
        if (dto.path && existing.path === dto.path) {
          throw new ConflictException(`Menu with path "${dto.path}" already exists`);
        }
        throw new ConflictException(`Menu with permission key "${dto.permissionKey}" already exists`);
      }
    }

    const updated = await this.menuModel
      .findByIdAndUpdate(id, dto, { new: true })
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('Menu not found');
    await this.clearMenuCache();
    return updated as any;
  }

  async deleteMenu(id: string): Promise<void> {
    const menu = await this.menuModel.findById(id);
    if (!menu) throw new NotFoundException('Menu not found');

    const { parentId, order } = menu;

    // Delete the menu
    await this.menuModel.findByIdAndDelete(id).exec();

    // Re-order: Shift up all items that were after the deleted item at the same level
    await this.menuModel.updateMany(
      {
        parentId: parentId || null,
        order: { $gt: order }
      },
      { $inc: { order: -1 } }
    ).exec();

    // Clear cache
    await this.clearMenuCache();
  }

  async getAllMenus(isSuperAdmin: boolean, queryDto: MenuPaginationQueryDto = {}): Promise<PaginatedResponseDto<Menu>> {
    const { page = 1, limit = 10, search, sort, filters } = queryDto;
    const skip = (Number(page) - 1) * Number(limit);

    const baseQuery: any = isSuperAdmin ? {} : { isVisible: true };
    const searchFilter: any = {};

    if (search) {
      searchFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { path: { $regex: search, $options: 'i' } },
        { permissionKey: { $regex: search, $options: 'i' } },
        { group: { $regex: search, $options: 'i' } },
      ];
    }

    let parsedFilters = {};
    if (filters) {
      parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
    }

    const finalQuery = { ...baseQuery, ...searchFilter, ...parsedFilters };

    const total = await this.menuModel.countDocuments(finalQuery).exec();

    const sortObj: any = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortObj[field] = order === 'desc' ? -1 : 1;
    } else {
      sortObj.order = 1;
    }

    const data = await this.menuModel
      .find(finalQuery)
      .populate('parentId', 'id name')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec() as any;

    return createPaginatedResponse(data, total, page, limit);
  }

  async getUserMenus(userPermissions: string[], roleName: string): Promise<any[]> {
    const cacheKey = `menus:v1:${roleName}`;
    const cachedMenus = await this.cacheManager.get<any[]>(cacheKey);

    if (cachedMenus) {
      return cachedMenus;
    }

    const normalizedRole = roleName?.toUpperCase().replace(/['"]/g, '');
    const isSuperAdmin = normalizedRole === SystemUserRole.SUPER_ADMIN;

    const query: any = { isActive: true };
    if (!isSuperAdmin) {
      query.isVisible = true;
    }

    // Clean permissions (remove extra quotes like "'*'" -> "*")
    const cleanPermissions = userPermissions.map(p => p.replace(/['"]/g, ''));

    const allMenus = await this.menuModel
      .find(query)
      .sort({ order: 1 })
      .lean()
      .exec();

    let filteredMenus: any[] = [];

    if (isSuperAdmin) {
      filteredMenus = allMenus;
    } else {
      filteredMenus = allMenus.filter((menu) => {
        const groupMatch = menu.group?.toLowerCase() !== 'super admin controls';
        const permissionMatch = cleanPermissions.includes('*') || cleanPermissions.includes(menu.permissionKey);

        return groupMatch && permissionMatch;
      });
    }

    // Build Tree
    const menuTree = this.buildTree(filteredMenus);

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, menuTree, 3600 * 1000);

    return menuTree;
  }

  private buildTree(menus: any[], parentId: any = null): any[] {
    const tree: any[] = [];
    const childrenMap = new Map();

    // Group children by parentId
    menus.forEach((menu) => {
      const pId = menu.parentId ? menu.parentId.toString() : null;
      if (!childrenMap.has(pId)) {
        childrenMap.set(pId, []);
      }
      childrenMap.get(pId).push({
        ...menu,
        id: menu._id.toString(),
        children: [],
      });
    });

    const getChildren = (pId: string | null) => {
      const children = childrenMap.get(pId) || [];
      children.forEach((child: any) => {
        child.children = getChildren(child.id);
      });
      return children;
    };

    return getChildren(null);
  }
}

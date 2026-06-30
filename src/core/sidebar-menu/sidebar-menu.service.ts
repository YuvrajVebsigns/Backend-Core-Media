import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { SidebarMenu } from './sidebar-menu.schema';
import { CreateSidebarMenuDto } from './dto/create-sidebar-menu.dto';
import { UpdateSidebarMenuDto } from './dto/update-sidebar-menu.dto';
import { SidebarMenuPaginationQueryDto } from './dto/sidebar-menu-pagination-query.dto';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';
import { createPaginatedResponse } from '@common/utils/pagination.util';

import { SystemUserRole } from '@common/enums/role.enum';

@Injectable()
export class SidebarMenuService {
  constructor(
    @InjectModel(SidebarMenu.name) private sidebarMenuModel: Model<SidebarMenu>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async clearSidebarMenuCache() {
    const manager = this.cacheManager as any;
    try {
      if (manager.clear) await manager.clear();
      else if (manager.reset) await manager.reset();
      else if (manager.store?.clear) await manager.store.clear();
      else if (manager.store?.reset) await manager.store.reset();
    } catch (error) {
      console.warn('⚠️ Could not clear sidebarMenu cache:', error.message);
    }
  }

  async createSidebarMenu(dto: CreateSidebarMenuDto): Promise<SidebarMenu> {
    if (dto.group) {
      dto.group = dto.group.toLowerCase();
    }
    // Check for duplicates
    const existing = await this.sidebarMenuModel.findOne({ path: dto.path });

    if (existing) {
      throw new ConflictException(
        `SidebarMenu with path "${dto.path}" already exists`,
      );
    }

    if (dto.order === undefined || dto.order === null) {
      const lastSidebarMenu = await this.sidebarMenuModel
        .findOne({ parentId: (dto.parentId as any) || null })
        .sort({ order: -1 })
        .exec();
      dto.order = lastSidebarMenu ? lastSidebarMenu.order + 1 : 0;
    }
    const newSidebarMenu = new this.sidebarMenuModel(dto);
    const saved = await newSidebarMenu.save();
    await this.clearSidebarMenuCache();
    return saved;
  }

  async updateSidebarMenu(
    id: string,
    dto: UpdateSidebarMenuDto,
  ): Promise<SidebarMenu> {
    if (dto.group) {
      dto.group = dto.group.toLowerCase();
    }
    // Check for duplicates excluding current item
    if (dto.path) {
      const existing = await this.sidebarMenuModel.findOne({
        _id: { $ne: id },
        path: dto.path,
      });

      if (existing) {
        throw new ConflictException(
          `SidebarMenu with path "${dto.path}" already exists`,
        );
      }
    }

    const updated = await this.sidebarMenuModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('SidebarMenu not found');
    await this.clearSidebarMenuCache();
    return updated as any;
  }

  async deleteSidebarMenu(id: string): Promise<void> {
    const sidebarMenu = await this.sidebarMenuModel.findById(id);
    if (!sidebarMenu) throw new NotFoundException('SidebarMenu not found');

    const { parentId, order } = sidebarMenu;

    // Delete the sidebarMenu
    await this.sidebarMenuModel
      .findByIdAndUpdate(id, { isDeleted: new Date() })
      .exec();

    // Re-order: Shift up all items that were after the deleted item at the same level
    await this.sidebarMenuModel
      .updateMany(
        {
          parentId: parentId || null,
          order: { $gt: order },
        },
        { $inc: { order: -1 } },
      )
      .exec();

    // Clear cache
    await this.clearSidebarMenuCache();
  }

  async getAllSidebarMenus(
    isSuperAdmin: boolean,
    queryDto: SidebarMenuPaginationQueryDto = {},
  ): Promise<PaginatedResponseDto<SidebarMenu>> {
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

    let parsedFilters: any = {};
    if (filters) {
      parsedFilters =
        typeof filters === 'string' ? JSON.parse(filters) : filters;
    }

    // If not super_admin, hide super admin controls group
    if (!isSuperAdmin) {
      parsedFilters.group = { $ne: 'super admin controls' };
    }

    const finalQuery = { ...baseQuery, ...searchFilter, ...parsedFilters };

    const total = await this.sidebarMenuModel.countDocuments(finalQuery).exec();

    const sortObj: any = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortObj[field] = order === 'desc' ? -1 : 1;
    } else {
      sortObj.order = 1;
    }

    const data = (await this.sidebarMenuModel
      .find(finalQuery)
      .populate('parentId', 'id name')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec()) as any;

    return createPaginatedResponse(data, total, page, limit);
  }

  async getUserSidebarMenus(
    userPermissions: string[],
    roleKey: string,
  ): Promise<any[]> {
    const cacheKey = `menus:${roleKey}`;
    const cachedSidebarMenus = await this.cacheManager.get<any[]>(cacheKey);

    if (cachedSidebarMenus) {
      return cachedSidebarMenus;
    }

    const isSuperAdmin = roleKey === SystemUserRole.SUPER_ADMIN;

    const query: any = { isActive: true };
    if (!isSuperAdmin) {
      query.isVisible = true;
    }

    // Clean permissions (remove extra quotes like "'*'" -> "*")
    const cleanPermissions = userPermissions.map((p) => p.replace(/['"]/g, ''));

    const allSidebarMenus = await this.sidebarMenuModel
      .find(query)
      .sort({ order: 1 })
      .lean()
      .exec();

    let filteredSidebarMenus: any[] = [];

    if (isSuperAdmin) {
      filteredSidebarMenus = allSidebarMenus;
    } else {
      filteredSidebarMenus = allSidebarMenus.filter((sidebarMenu) => {
        const groupMatch =
          sidebarMenu.group?.toLowerCase() !== 'super admin controls';
        const permissionMatch =
          cleanPermissions.includes('*') ||
          cleanPermissions.includes(sidebarMenu.permissionKey);

        return groupMatch && permissionMatch;
      });
    }

    // Build Tree
    const sidebarMenuTree = this.buildTree(filteredSidebarMenus);

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, sidebarMenuTree, 3600 * 1000);

    return sidebarMenuTree;
  }

  private buildTree(sidebarMenus: any[], parentId: any = null): any[] {
    const tree: any[] = [];
    const childrenMap = new Map();

    // Group children by parentId
    sidebarMenus.forEach((sidebarMenu) => {
      const pId = sidebarMenu.parentId ? sidebarMenu.parentId.toString() : null;
      if (!childrenMap.has(pId)) {
        childrenMap.set(pId, []);
      }
      childrenMap.get(pId).push({
        ...sidebarMenu,
        id: sidebarMenu._id.toString(),
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

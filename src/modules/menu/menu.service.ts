import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Menu } from './menu.schema';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

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
    const newMenu = new this.menuModel(dto);
    const saved = await newMenu.save();
    await this.clearMenuCache();
    return saved;
  }

  async updateMenu(id: string, dto: UpdateMenuDto): Promise<Menu> {
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

  async getAllMenus(): Promise<Menu[]> {
    return this.menuModel.find().sort({ order: 1 }).lean().exec() as any;
  }

  async getUserMenus(userPermissions: string[], roleName: string): Promise<any[]> {
    const cacheKey = `menus:v1:${roleName}`;
    const cachedMenus = await this.cacheManager.get<any[]>(cacheKey);

    if (cachedMenus) {
      return cachedMenus;
    }

    const query: any = { isActive: true, isVisible: true };
    const normalizedRole = roleName?.toUpperCase().replace(/['"]/g, '');
    const isSuperAdmin = normalizedRole === SystemUserRole.SUPER_ADMIN;

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
        const groupMatch = menu.group !== 'Super Admin Controls';
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

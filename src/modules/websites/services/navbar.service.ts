import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Navbar } from '../schemas/navbar.schema';
import { CreateNavbarItemDto } from '../dto/create-navbar-item.dto';
import { UpdateNavbarItemDto } from '../dto/update-navbar-item.dto';
import { ReorderNavbarDto } from '../dto/reorder-navbar.dto';
import { WebsiteCacheService } from './website-cache.service';
import { buildNestedMenu } from '../utils/nested-menu-builder';

@Injectable()
export class NavbarService {
  constructor(
    @InjectModel(Navbar.name) private readonly navbarModel: Model<Navbar>,
    private readonly cacheService: WebsiteCacheService,
  ) {}

  async create(
    createDto: CreateNavbarItemDto,
    userId: string,
  ): Promise<Navbar> {
    const navbar = new this.navbarModel({
      ...createDto,
      createdBy: userId,
    });
    const saved = await navbar.save();
    await this.cacheService.invalidateNavbar(createDto.siteId, saved.position);
    return saved;
  }

  async findAll(
    siteId: string,
    position?: string,
    nested = true,
    onlyVisible = false,
  ): Promise<any[]> {
    if (position && nested && onlyVisible) {
      const cached = await this.cacheService.getNavbar(siteId, position);
      if (cached) return cached;
    }

    const query: any = { siteId, isDeleted: null };
    if (position) {
      query.position = position;
    }
    if (onlyVisible) {
      query.isVisible = true;
    }

    const items = await this.navbarModel.find(query).sort({ order: 1 }).exec();

    let result: any[] = items;
    if (nested) {
      result = buildNestedMenu(items);
    }

    if (onlyVisible) {
      const filterVisible = (item: any) => {
        const raw = item.toJSON ? item.toJSON() : item;
        if (raw.items && Array.isArray(raw.items)) {
          raw.items = raw.items.filter((subItem: any) => subItem.isVisible !== false);
        }
        if (raw.children && Array.isArray(raw.children)) {
          raw.children = raw.children
            .filter((child: any) => child.isVisible !== false)
            .map(filterVisible);
        }
        return raw;
      };
      result = result.map(filterVisible);
    }

    if (position && nested && onlyVisible) {
      await this.cacheService.setNavbar(siteId, position, result);
    }

    return result;
  }

  async findOne(id: string): Promise<Navbar> {
    const item = await this.navbarModel
      .findOne({ _id: id, isDeleted: null })
      .exec();
    if (!item) {
      throw new NotFoundException(`Navbar item with ID ${id} not found`);
    }
    return item;
  }

  async update(
    id: string,
    updateDto: UpdateNavbarItemDto,
    userId: string,
  ): Promise<Navbar> {
    const existing = await this.findOne(id);
    const updated = await this.navbarModel
      .findOneAndUpdate(
        { _id: id },
        { ...updateDto, updatedBy: userId },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Navbar item with ID ${id} not found`);
    }

    await this.cacheService.invalidateNavbar(
      existing.siteId.toString(),
      existing.position,
    );
    if (updateDto.position && updateDto.position !== existing.position) {
      await this.cacheService.invalidateNavbar(
        existing.siteId.toString(),
        updateDto.position,
      );
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    await this.navbarModel
      .updateOne({ _id: id }, { isDeleted: new Date() })
      .exec();
    await this.cacheService.invalidateNavbar(
      existing.siteId.toString(),
      existing.position,
    );
  }

  async reorder(reorderDto: ReorderNavbarDto): Promise<void> {
    const bulkOps = reorderDto.orders.map((o) => ({
      updateOne: {
        filter: { _id: o.id },
        update: { $set: { order: o.order } },
      },
    }));

    if (bulkOps.length > 0) {
      await this.navbarModel.bulkWrite(bulkOps);
      const firstItem = await this.navbarModel
        .findById(reorderDto.orders[0].id)
        .exec();
      if (firstItem) {
        await this.cacheService.invalidateNavbar(
          firstItem.siteId.toString(),
          firstItem.position,
        );
      }
    }
  }
}

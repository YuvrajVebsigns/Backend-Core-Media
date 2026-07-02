import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class WebsiteCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  private getPageKey(siteId: string, slug: string): string {
    return `website:page:${siteId}:${slug}`;
  }

  private getNavbarKey(siteId: string, position: string): string {
    return `website:navbar:${siteId}:${position}`;
  }

  private getSeoKey(siteId: string, slug: string): string {
    return `website:seo:${siteId}:${slug}`;
  }

  async getPage(siteId: string, slug: string): Promise<any | null> {
    try {
      return await this.cacheManager.get(this.getPageKey(siteId, slug));
    } catch (e) {
      return null;
    }
  }

  async setPage(siteId: string, slug: string, pageData: any): Promise<void> {
    try {
      await this.cacheManager.set(
        this.getPageKey(siteId, slug),
        pageData,
        300 * 1000,
      ); // 5 mins
    } catch (e) {}
  }

  async invalidatePage(siteId: string, slug: string): Promise<void> {
    try {
      await this.cacheManager.del(this.getPageKey(siteId, slug));
      await this.cacheManager.del(this.getSeoKey(siteId, slug));
    } catch (e) {}
  }

  async getNavbar(siteId: string, position: string): Promise<any | null> {
    try {
      return await this.cacheManager.get(this.getNavbarKey(siteId, position));
    } catch (e) {
      return null;
    }
  }

  async setNavbar(
    siteId: string,
    position: string,
    navbarData: any,
  ): Promise<void> {
    try {
      await this.cacheManager.set(
        this.getNavbarKey(siteId, position),
        navbarData,
        300 * 1000,
      );
    } catch (e) {}
  }

  async invalidateNavbar(siteId: string, position: string): Promise<void> {
    try {
      await this.cacheManager.del(this.getNavbarKey(siteId, position));
    } catch (e) {}
  }

  async invalidateAllForSite(siteId: string): Promise<void> {
    try {
      const manager = this.cacheManager as any;
      if (manager.store?.keys) {
        const keys = await manager.store.keys(`website:*:${siteId}:*`);
        for (const key of keys) {
          await this.cacheManager.del(key);
        }
      } else {
        if (manager.clear) await manager.clear();
        else if (manager.reset) await manager.reset();
      }
    } catch (e) {
      console.warn('⚠️ Cache invalidation warning:', e.message);
    }
  }
}

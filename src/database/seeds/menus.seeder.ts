import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { MenuService } from '../../modules/menu/menu.service';

@Injectable()
export class MenusSeeder implements OnApplicationBootstrap {
  constructor(private readonly menuService: MenuService) { }

  async onApplicationBootstrap() {
    await this.seed();
  }

  async seed() {
    const menus = [
      {
        name: 'Dashboard',
        path: '/',
        permissionKey: 'dashboard.view',
        icon: 'GridIcon',
        order: 1,
        group: 'menu',
      },
      {
        name: 'Websites Management',
        path: '/websites',
        permissionKey: 'websites.view',
        icon: 'GlobeIcon',
        order: 2,
        group: 'menu',
      },
      {
        name: 'Sidebar Menu',
        path: '/sidebar-menu',
        permissionKey: 'sidebar-menu.view',
        icon: 'PageIcon',
        order: 3,
        group: 'super admin controls',
      },
      {
        name: 'Roles & Permission',
        path: '/roles-permission',
        permissionKey: 'roles-permission.view',
        icon: 'PageIcon',
        order: 4,
        group: 'super admin controls',
      },
      {
        name: 'Feature Toggle',
        path: '/feature-toggle',
        permissionKey: 'feature-toggle.view',
        icon: 'GridIcon',
        order: 5,
        group: 'super admin controls',
      },
      {
        name: 'Settings',
        path: '/settings',
        permissionKey: 'settings.view',
        icon: 'PageIcon',
        order: 6,
        group: 'super admin controls',
      },
      {
        name: 'Support Ticket',
        path: '/support-ticket',
        permissionKey: 'support-ticket.view',
        icon: 'PageIcon',
        order: 7,
        group: 'super admin controls',
      },
    ];

    const existingMenus = await this.menuService.getAllMenus(true, { page: 1, limit: 10 });

    // Simple check: if no menus exist, seed them
    if (existingMenus.data.length === 0) {
      for (const menuData of menus) {
        try {
          await this.menuService.createMenu(menuData as any);
          console.log(`✅ Menu seeded: ${menuData.name}`);
        } catch (error) {
          console.error(`❌ Failed to seed menu ${menuData.name}:`, error.message);
        }
      }
    }
  }
}

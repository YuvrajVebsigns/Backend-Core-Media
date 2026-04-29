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
        group: 'MENU',
      },
      {
        name: 'Websites Management',
        path: '/websites',
        permissionKey: 'websites.view',
        icon: 'GlobeIcon',
        order: 2,
        group: 'MENU',
      },
      {
        name: 'Sidebar Menu',
        path: '/sidebar-menu',
        permissionKey: 'sidebar-menu.view',
        icon: 'PageIcon',
        order: 3,
        group: 'Super Admin Controls',
      },
      {
        name: 'Roles & Permission',
        path: '/roles-permission',
        permissionKey: 'roles-permission.view',
        icon: 'PageIcon',
        order: 4,
        group: 'Super Admin Controls',
      },
      {
        name: 'Feature Toggle',
        path: '/feature-toggle',
        permissionKey: 'feature-toggle.view',
        icon: 'GridIcon',
        order: 5,
        group: 'Super Admin Controls',
      },
      {
        name: 'Settings',
        path: '/settings',
        permissionKey: 'settings.view',
        icon: 'PageIcon',
        order: 6,
        group: 'Super Admin Controls',
      },
      {
        name: 'Support Ticket',
        path: '/support-ticket',
        permissionKey: 'support-ticket.view',
        icon: 'PageIcon',
        order: 7,
        group: 'Super Admin Controls',
      },
    ];

    const existingMenus = await this.menuService.getAllMenus();

    // Simple check: if no menus exist, seed them
    if (existingMenus.length === 0) {
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

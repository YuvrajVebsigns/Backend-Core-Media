import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SidebarMenuService } from '../../modules/sidebar-menu/sidebar-menu.service';

@Injectable()
export class SidebarMenusSeeder implements OnApplicationBootstrap {
  constructor(private readonly sidebarMenuService: SidebarMenuService) { }

  async onApplicationBootstrap() {
    await this.seed();
  }

  async seed() {
    const menus = [
      {
        name: 'Dashboard',
        path: '/',
        permissionKey: 'dashboard.view',
        icon: 'layout-dashboard',
        order: 1,
        group: 'menu',
      },
      {
        name: 'Websites Management',
        path: '/websites',
        permissionKey: 'websites.view',
        icon: 'globe',
        order: 2,
        group: 'menu',
      },
      {
        name: 'Roles & Permission',
        path: '/roles-permission',
        permissionKey: 'roles-permission.view',
        icon: 'user-round-key',
        order: 4,
        group: 'system administration',
      },
      {
        name: 'Staffs',
        path: '/staffs',
        permissionKey: 'staffs.view',
        icon: 'users-round',
        order: 5,
        group: 'system administration',
      },
      {
        name: 'Sidebar Menu',
        path: '/sidebar-menu',
        permissionKey: 'sidebar-menu.view',
        icon: 'menu',
        order: 3,
        group: 'super admin controls',
      },
      {
        name: 'Feature Toggle',
        path: '/feature-toggle',
        permissionKey: 'feature-toggle.view',
        icon: 'toggle-right',
        order: 5,
        group: 'super admin controls',
      },
      {
        name: 'Settings',
        path: '/settings',
        permissionKey: 'settings.view',
        icon: 'settings',
        order: 6,
        group: 'super admin controls',
      },
      {
        name: 'Support Ticket',
        path: '/support-ticket',
        permissionKey: 'support-ticket.view',
        icon: 'tickets',
        order: 7,
        group: 'super admin controls',
      },
    ];

    const existingSidebarMenus = await this.sidebarMenuService.getAllSidebarMenus(true, { page: 1, limit: 10 });

    // Simple check: if no menus exist, seed them
    if (existingSidebarMenus.data.length === 0) {
      for (const menuData of menus) {
        try {
          await this.sidebarMenuService.createSidebarMenu(menuData as any);
          console.log(`✅ SidebarMenu seeded: ${menuData.name}`);
        } catch (error) {
          console.error(`❌ Failed to seed menu ${menuData.name}:`, error.message);
        }
      }
    }
  }
}

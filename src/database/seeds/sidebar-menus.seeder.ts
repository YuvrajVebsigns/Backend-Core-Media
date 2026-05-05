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
        icon: 'layout-grid',
        order: 1,
        group: 'general',
      },
      {
        name: 'Websites',
        path: '/websites',
        permissionKey: 'websites.view',
        icon: 'layout-grid',
        order: 1,
        group: 'content management',
      },
      {
        name: 'Pages',
        path: '/pages',
        permissionKey: 'pages.view',
        icon: 'file',
        order: 2,
        group: 'content management',
      },
      {
        name: 'Blogs',
        path: '/blogs',
        permissionKey: 'blogs.view',
        icon: 'text-quote',
        order: 3,
        group: 'content management',
      },
      {
        name: 'Events',
        path: '/events',
        permissionKey: 'events.view',
        icon: 'calendar',
        order: 1,
        group: 'events management',
      },
      {
        name: 'Sponsors',
        path: '/sponsors',
        permissionKey: 'sponsors.view',
        icon: 'box',
        order: 2,
        group: 'events management',
      },
      {
        name: 'Registrations',
        path: '/registrations',
        permissionKey: 'registrations.view',
        icon: 'table-properties',
        order: 3,
        group: 'events management',
      },
      {
        name: 'Attendance',
        path: '/attendance',
        permissionKey: 'attendance.view',
        icon: 'calendar-check',
        order: 4,
        group: 'events management',
      },
      {
        name: 'Nominators',
        path: '/nominators',
        permissionKey: 'nominators.view',
        icon: 'user-circle',
        order: 5,
        group: 'events management',
      },
      {
        name: 'Nominees',
        path: '/nominees',
        permissionKey: 'nominees.view',
        icon: 'table-properties',
        order: 6,
        group: 'events management',
      },
      {
        name: 'System Users',
        path: '/users',
        permissionKey: 'users.view',
        icon: 'users',
        order: 1,
        group: 'user management',
      },
      {
        name: 'Roles & Permissions',
        path: '/roles-permission',
        permissionKey: 'roles.view',
        icon: 'copy',
        order: 2,
        group: 'user management',
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

    for (const menuData of menus) {
      try {
        // Check if menu exists by name (simplistic but works for seeds)
        const existing = await this.sidebarMenuService.getAllSidebarMenus(true, {
          page: 1,
          limit: 1,
          search: menuData.name
        });

        if (existing.data.length === 0) {
          await this.sidebarMenuService.createSidebarMenu(menuData as any);
          console.log(`✅ SidebarMenu seeded: ${menuData.name}`);
        } else {
          // Optional: Update existing menu if needed
          // await this.sidebarMenuService.updateSidebarMenu(existing.data[0].id, menuData as any);
        }
      } catch (error) {
        console.error(`❌ Failed to seed menu ${menuData.name}:`, error.message);
      }
    }
  }
}

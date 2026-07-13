import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SidebarMenuService } from '@core/sidebar-menu/sidebar-menu.service';

@Injectable()
export class SidebarMenusSeeder implements OnApplicationBootstrap {
  constructor(private readonly sidebarMenuService: SidebarMenuService) {}

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
        name: 'Media',
        path: '/media',
        permissionKey: 'media.view',
        icon: 'image',
        order: 4,
        group: 'content management',
      },
      {
        name: 'Contacts',
        path: '/contacts',
        permissionKey: 'contacts.view',
        icon: 'mail',
        order: 5,
        group: 'content management',
      },
      {
        name: 'Events',
        path: '/events',
        permissionKey: 'events.view',
        icon: 'calendar',
        order: 5,
        group: 'events management',
      },
      {
        name: 'Sponsors',
        path: '/sponsors',
        permissionKey: 'sponsors.view',
        icon: 'box',
        order: 6,
        group: 'events management',
      },
      {
        name: 'Registrations',
        path: '/registrations',
        permissionKey: 'registrations.view',
        icon: 'table-properties',
        order: 7,
        group: 'events management',
      },
      {
        name: 'Attendance',
        path: '/attendance',
        permissionKey: 'attendance.view',
        icon: 'calendar-check',
        order: 8,
        group: 'events management',
      },
      {
        name: 'Nominators',
        path: '/nominators',
        permissionKey: 'nominators.view',
        icon: 'user-circle',
        order: 9,
        group: 'events management',
      },
      {
        name: 'Nominees',
        path: '/nominees',
        permissionKey: 'nominees.view',
        icon: 'table-properties',
        order: 10,
        group: 'events management',
      },
      {
        name: 'System Users',
        path: '/users',
        permissionKey: 'users.view',
        icon: 'users',
        order: 11,
        group: 'user management',
      },
      {
        name: 'Roles & Permissions',
        path: '/roles-permission',
        permissionKey: 'roles.view',
        icon: 'copy',
        order: 12,
        group: 'user management',
      },
      {
        name: 'Sidebar Menu',
        path: '/sidebar-menu',
        permissionKey: 'sidebar-menu.view',
        icon: 'menu',
        order: 13,
        group: 'super admin controls',
      },
      {
        name: 'Feature Toggle',
        path: '/feature-toggle',
        permissionKey: 'feature-toggle.view',
        icon: 'toggle-right',
        order: 14,
        group: 'super admin controls',
      },
      {
        name: 'Settings',
        path: '/settings',
        permissionKey: 'settings.view',
        icon: 'settings',
        order: 15,
        group: 'super admin controls',
      },
      {
        name: 'Support Ticket',
        path: '/support-ticket',
        permissionKey: 'support-ticket.view',
        icon: 'tickets',
        order: 16,
        group: 'super admin controls',
      },
      {
        name: 'Deployment Control',
        path: '/deployments',
        permissionKey: 'deployments.view',
        icon: 'terminal',
        order: 17,
        group: 'super admin controls',
      },
    ];

    // 1. Seed base menus
    for (const menuData of menus) {
      try {
        const existing = await this.sidebarMenuService.getAllSidebarMenus(
          true,
          {
            page: 1,
            limit: 1,
            search: menuData.name,
          },
        );

        if (existing.data.length === 0) {
          await this.sidebarMenuService.createSidebarMenu(menuData);
          console.log(`✅ SidebarMenu seeded: ${menuData.name}`);
        }
      } catch (error) {
        console.error(
          `❌ Failed to seed menu ${menuData.name}:`,
          error.message,
        );
      }
    }

    // 2. Seed Communications Parent Menu
    let commParent: any = null;
    try {
      const existing = await this.sidebarMenuService.getAllSidebarMenus(true, {
        page: 1,
        limit: 1,
        filters: { name: 'Communications' },
      });

      if (existing.data.length === 0) {
        commParent = await this.sidebarMenuService.createSidebarMenu({
          name: 'Communications',
          path: '/communications',
          permissionKey: 'communications.view',
          icon: 'messages-square',
          order: 6,
          group: 'content management',
        });
        console.log(`✅ Parent SidebarMenu seeded: Communications`);
      } else {
        commParent = existing.data[0];
      }
    } catch (error) {
      console.error(
        '❌ Failed to seed Communications parent menu:',
        error.message,
      );
    }

    // 3. Seed Communications Child Menus if parent is resolved
    if (commParent) {
      const parentId = commParent.id || commParent._id;
      const children = [
        {
          name: 'Delivery Report',
          path: '/delivery-report',
          permissionKey: 'communications.view',
          icon: 'scroll-text',
          order: 1,
          group: 'content management',
          parentId,
        },
        {
          name: 'Templates',
          path: '/templates',
          permissionKey: 'communications.view',
          icon: 'file-code',
          order: 2,
          group: 'content management',
          parentId,
        },
        {
          name: 'Providers / Plugins',
          path: '/providers-plugins',
          permissionKey: 'communications.view',
          icon: 'activity',
          order: 3,
          group: 'super admin controls',
          parentId,
        },
        {
          name: 'Variables',
          path: '/variables',
          permissionKey: 'communications.view',
          icon: 'braces',
          order: 4,
          group: 'content management',
          parentId,
        },
      ];

      for (const child of children) {
        try {
          const existing = await this.sidebarMenuService.getAllSidebarMenus(
            true,
            {
              page: 1,
              limit: 1,
              filters: { name: child.name },
            },
          );

          if (existing.data.length === 0) {
            await this.sidebarMenuService.createSidebarMenu(child);
            console.log(`   ✅ Submenu seeded: ${child.name}`);
          }
        } catch (error) {
          console.error(
            `   ❌ Failed to seed submenu ${child.name}:`,
            error.message,
          );
        }
      }
    }
  }
}

export const PERMISSIONS = {
  // System Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Roles
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',

  // Sidebar Menu
  SIDEBAR_MENU_VIEW: 'sidebar-menu.view',
  SIDEBAR_MENU_CREATE: 'sidebar-menu.create',
  SIDEBAR_MENU_UPDATE: 'sidebar-menu.update',
  SIDEBAR_MENU_DELETE: 'sidebar-menu.delete',
  SIDEBAR_MENU_READ_ALL: 'sidebar-menu.read_all',

  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',

  // Websites
  WEBSITES_VIEW: 'websites.view',
  WEBSITES_CREATE: 'websites.create',
  WEBSITES_UPDATE: 'websites.update',
  WEBSITES_DELETE: 'websites.delete',

  // Pages
  PAGES_VIEW: 'pages.view',
  PAGES_CREATE: 'pages.create',
  PAGES_UPDATE: 'pages.update',
  PAGES_DELETE: 'pages.delete',

  // Feature Toggle
  FEATURE_TOGGLE_VIEW: 'feature-toggle.view',
  FEATURE_TOGGLE_UPDATE: 'feature-toggle.update',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',

  // Support Tickets
  SUPPORT_TICKET_VIEW: 'support-ticket.view',
  SUPPORT_TICKET_UPDATE: 'support-ticket.update',

  // Blogs
  BLOGS_VIEW: 'blogs.view',
  BLOGS_CREATE: 'blogs.create',
  BLOGS_UPDATE: 'blogs.update',
  BLOGS_DELETE: 'blogs.delete',

  // Events
  EVENTS_VIEW: 'events.view',
  EVENTS_CREATE: 'events.create',
  EVENTS_UPDATE: 'events.update',
  EVENTS_DELETE: 'events.delete',

  // Sponsors
  SPONSORS_VIEW: 'sponsors.view',
  SPONSORS_CREATE: 'sponsors.create',
  SPONSORS_UPDATE: 'sponsors.update',
  SPONSORS_DELETE: 'sponsors.delete',

  // Registrations
  REGISTRATIONS_VIEW: 'registrations.view',
  REGISTRATIONS_CREATE: 'registrations.create',
  REGISTRATIONS_UPDATE: 'registrations.update',
  REGISTRATIONS_DELETE: 'registrations.delete',

  // Attendance
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_UPDATE: 'attendance.update',
  ATTENDANCE_DELETE: 'attendance.delete',

  // Nominators
  NOMINATORS_VIEW: 'nominators.view',
  NOMINATORS_CREATE: 'nominators.create',
  NOMINATORS_UPDATE: 'nominators.update',
  NOMINATORS_DELETE: 'nominators.delete',

  // Nominees
  NOMINEES_VIEW: 'nominees.view',
  NOMINEES_CREATE: 'nominees.create',
  NOMINEES_UPDATE: 'nominees.update',
  NOMINEES_DELETE: 'nominees.delete',
};

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PROTECTED_PERMISSIONS = [
  PERMISSIONS.SIDEBAR_MENU_VIEW,
  PERMISSIONS.SIDEBAR_MENU_CREATE,
  PERMISSIONS.SIDEBAR_MENU_UPDATE,
  PERMISSIONS.SIDEBAR_MENU_DELETE,
  PERMISSIONS.SIDEBAR_MENU_READ_ALL,
  PERMISSIONS.FEATURE_TOGGLE_VIEW,
  PERMISSIONS.FEATURE_TOGGLE_UPDATE,
  PERMISSIONS.SETTINGS_VIEW,
  PERMISSIONS.SETTINGS_UPDATE,
  PERMISSIONS.SUPPORT_TICKET_VIEW,
  PERMISSIONS.SUPPORT_TICKET_UPDATE,
];

/**
 * Defines which CMS module owns the file.
 * Used for storage path generation and access-control scoping.
 */
export enum FileModule {
  BLOGS = 'blogs',
  BRANDING = 'branding',
  EVENTS = 'events',
  USERS = 'users',
  WEBSITES = 'websites',
  DOCUMENTS = 'documents',
  REPORTS = 'reports',
  TEAMS = 'teams',
  MEDIA = 'media',
}

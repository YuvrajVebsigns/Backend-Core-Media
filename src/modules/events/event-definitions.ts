// ──────────────────────────────────────────────
// Domain Event Definitions
// Generated from actual backend modules
// ──────────────────────────────────────────────

// ──────────────────────────────────────────────
// Auth Module Events
// ──────────────────────────────────────────────

export class UserSignedUpEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly roleKey: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}

export class UserLoggedInEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly loggedInAt: Date = new Date(),
  ) {}
}

export class PasswordResetEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly resetAt: Date = new Date(),
  ) {}
}

export class UserScreenshotViolationEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: string,
    public readonly detectedAt: Date = new Date(),
  ) {}
}

// ──────────────────────────────────────────────
// System Users Module Events
// ──────────────────────────────────────────────

export class SystemUserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}

export class SystemUserUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly changes: Record<string, any>,
    public readonly updatedAt: Date = new Date(),
  ) {}
}

// ──────────────────────────────────────────────
// Attendees Module Events
// ──────────────────────────────────────────────

export class AttendeeRegisteredEvent {
  constructor(
    public readonly registreeId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly eventId: string,
    public readonly websiteId: string | undefined,
    public readonly registeredAt: Date = new Date(),
  ) {}
}

export class AttendeeApprovedEvent {
  constructor(
    public readonly attendeeId: string,
    public readonly registreeId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly eventId: string,
    public readonly passCode: string,
    public readonly approvedAt: Date = new Date(),
  ) {}
}

export class AttendeeRejectedEvent {
  constructor(
    public readonly registreeId: string,
    public readonly email: string,
    public readonly eventId: string,
    public readonly rejectedAt: Date = new Date(),
  ) {}
}

export class AttendeeBlockedEvent {
  constructor(
    public readonly registreeId: string,
    public readonly email: string,
    public readonly eventId: string,
    public readonly blockedAt: Date = new Date(),
  ) {}
}

export class AttendeeCheckedInEvent {
  constructor(
    public readonly attendeeId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly eventId: string,
    public readonly passCode: string,
    public readonly checkedInAt: Date = new Date(),
  ) {}
}

export class AttendeeCreatedByAdminEvent {
  constructor(
    public readonly attendeeId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly eventId: string,
    public readonly passCode: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}

// ──────────────────────────────────────────────
// Event Management Module Events
// ──────────────────────────────────────────────

export class EventReminderEvent {
  constructor(
    public readonly attendeeId: string,
    public readonly eventId: string,
    public readonly templateId: string,
    public readonly sentAt: Date = new Date(),
  ) {}
}

export class EventCreatedEvent {
  constructor(
    public readonly eventId: string,
    public readonly title: string,
    public readonly type: string,
    public readonly createdBy: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}

export class EventUpdatedEvent {
  constructor(
    public readonly eventId: string,
    public readonly title: string,
    public readonly changes: Record<string, any>,
    public readonly updatedAt: Date = new Date(),
  ) {}
}

export class EventDeletedEvent {
  constructor(
    public readonly eventId: string,
    public readonly title: string,
    public readonly deletedAt: Date = new Date(),
  ) {}
}

export class EventMeetingCreatedEvent {
  constructor(
    public readonly meetingId: string,
    public readonly eventId: string,
    public readonly title: string,
    public readonly eventTitle: string,
    public readonly time: string,
    public readonly date: string,
    public readonly eventDetails: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}

// ──────────────────────────────────────────────
// Blog Module Events
// ──────────────────────────────────────────────

export class BlogCreatedEvent {
  constructor(
    public readonly blogId: string,
    public readonly title: string,
    public readonly authorId: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}

export class BlogUpdatedEvent {
  constructor(
    public readonly blogId: string,
    public readonly title: string,
    public readonly updatedAt: Date = new Date(),
  ) {}
}

export class BlogDeletedEvent {
  constructor(
    public readonly blogId: string,
    public readonly deletedAt: Date = new Date(),
  ) {}
}

export class BlogCommentAddedEvent {
  constructor(
    public readonly blogId: string,
    public readonly commentId: string,
    public readonly authorName: string,
    public readonly authorEmail: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}

export class BlogLikedEvent {
  constructor(
    public readonly blogId: string,
    public readonly likedAt: Date = new Date(),
  ) {}
}

// ──────────────────────────────────────────────
// Contact Module Events
// ──────────────────────────────────────────────

export class ContactSubmittedEvent {
  constructor(
    public readonly contactId: string,
    public readonly fullName: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly service: string,
    public readonly message: string,
    public readonly websiteId: string,
    public readonly submittedAt: Date = new Date(),
  ) {}
}

export class ContactRepliedEvent {
  constructor(
    public readonly contactId: string,
    public readonly email: string,
    public readonly repliedBy: string,
    public readonly repliedAt: Date = new Date(),
  ) {}
}

export class SubscriberSubscribedEvent {
  constructor(
    public readonly subscriberId: string,
    public readonly email: string,
    public readonly websiteId: string,
    public readonly source: string,
    public readonly subscribedAt: Date = new Date(),
  ) {}
}

export class SubscriberBulkEmailSentEvent {
  constructor(
    public readonly websiteId: string | undefined,
    public readonly subject: string,
    public readonly recipientCount: number,
    public readonly sentTo: string[],
    public readonly sentAt: Date = new Date(),
  ) {}
}

// ──────────────────────────────────────────────
// Sponsor Module Events
// ──────────────────────────────────────────────

export class SponsorCreatedEvent {
  constructor(
    public readonly sponsorId: string,
    public readonly name: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}

export class SponsorUpdatedEvent {
  constructor(
    public readonly sponsorId: string,
    public readonly name: string,
    public readonly updatedAt: Date = new Date(),
  ) {}
}

export class SponsorDeletedEvent {
  constructor(
    public readonly sponsorId: string,
    public readonly deletedAt: Date = new Date(),
  ) {}
}

// ──────────────────────────────────────────────
// Nomination Module Events
// ──────────────────────────────────────────────

export class NominationSubmittedEvent {
  constructor(
    public readonly nominationId: string,
    public readonly categoryId: string,
    public readonly nomineeName: string,
    public readonly submittedBy: string,
    public readonly websiteId: string | undefined,
    public readonly submittedAt: Date = new Date(),
  ) {}
}

export class NominationStatusChangedEvent {
  constructor(
    public readonly nominationId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly changedAt: Date = new Date(),
  ) {}
}

// ──────────────────────────────────────────────
// Website Module Events
// ──────────────────────────────────────────────

export class WebsiteCreatedEvent {
  constructor(
    public readonly websiteId: string,
    public readonly name: string,
    public readonly domain: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}

export class WebsiteUpdatedEvent {
  constructor(
    public readonly websiteId: string,
    public readonly name: string,
    public readonly changes: Record<string, any>,
    public readonly updatedAt: Date = new Date(),
  ) {}
}

export class WebsitePagePublishedEvent {
  constructor(
    public readonly pageId: string,
    public readonly websiteId: string,
    public readonly slug: string,
    public readonly publishedBy: string,
    public readonly publishedAt: Date = new Date(),
  ) {}
}

// ──────────────────────────────────────────────
// Report Module Events
// ──────────────────────────────────────────────

export class ReportCreatedEvent {
  constructor(
    public readonly reportId: string,
    public readonly title: string,
    public readonly createdBy: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}

export class ReportDownloadedEvent {
  constructor(
    public readonly reportId: string,
    public readonly downloadedBy: string | undefined,
    public readonly websiteId: string | undefined,
    public readonly downloadUrl?: string,
    public readonly downloadedAt: Date = new Date(),
  ) {}
}

// ──────────────────────────────────────────────
// Communications Module Events
// ──────────────────────────────────────────────

export class CommunicationDispatchedEvent {
  constructor(
    public readonly logId: string,
    public readonly channel: string,
    public readonly recipient: string,
    public readonly templateSlug: string | undefined,
    public readonly dispatchedAt: Date = new Date(),
  ) {}
}

// ──────────────────────────────────────────────
// File Module Events
// ──────────────────────────────────────────────

export class FileUploadedEvent {
  constructor(
    public readonly fileId: string,
    public readonly filename: string,
    public readonly mimetype: string,
    public readonly size: number,
    public readonly uploadedBy: string | undefined,
    public readonly uploadedAt: Date = new Date(),
  ) {}
}

// ──────────────────────────────────────────────
// Event Name Constants
// Use these to avoid magic strings across the app
// ──────────────────────────────────────────────

export const AppEvents = {
  // Auth
  USER_SIGNED_UP: 'auth.signup',
  USER_LOGGED_IN: 'auth.login',
  PASSWORD_RESET: 'auth.password_reset',
  SECURITY_VIOLATION_SCREENSHOT: 'security.violation_screenshot',

  // System Users
  SYSTEM_USER_CREATED: 'system_user.created',
  SYSTEM_USER_UPDATED: 'system_user.updated',

  // Attendees
  ATTENDEE_REGISTERED: 'attendee.registered',
  ATTENDEE_APPROVED: 'attendee.approved',
  ATTENDEE_REJECTED: 'attendee.rejected',
  ATTENDEE_BLOCKED: 'attendee.blocked',
  ATTENDEE_CHECKED_IN: 'attendee.checked_in',
  ATTENDEE_CREATED_BY_ADMIN: 'attendee.created_by_admin',

  // Event Management
  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  EVENT_DELETED: 'event.deleted',
  EVENT_MEETING_CREATED: 'event.meeting_created',
  EVENT_REMINDER: 'event.reminder',

  // Blogs
  BLOG_CREATED: 'blog.created',
  BLOG_UPDATED: 'blog.updated',
  BLOG_DELETED: 'blog.deleted',
  BLOG_COMMENT_ADDED: 'blog.comment_added',
  BLOG_LIKED: 'blog.liked',

  // Contacts
  CONTACT_SUBMITTED: 'contact.submitted',
  CONTACT_REPLIED: 'contact.replied',

  // Subscribers
  SUBSCRIBER_SUBSCRIBED: 'subscriber.subscribed',
  SUBSCRIBER_BULK_EMAIL_SENT: 'subscriber.bulk_email_sent',

  // Sponsors
  SPONSOR_CREATED: 'sponsor.created',
  SPONSOR_UPDATED: 'sponsor.updated',
  SPONSOR_DELETED: 'sponsor.deleted',

  // Nominations
  NOMINATION_SUBMITTED: 'nomination.submitted',
  NOMINATION_STATUS_CHANGED: 'nomination.status_changed',

  // Websites
  WEBSITE_CREATED: 'website.created',
  WEBSITE_UPDATED: 'website.updated',
  WEBSITE_PAGE_PUBLISHED: 'website.page_published',

  // Reports
  REPORT_CREATED: 'report.created',
  REPORT_DOWNLOADED: 'report.downloaded',

  // Communications
  COMMUNICATION_DISPATCHED: 'communication.dispatched',

  // Files
  FILE_UPLOADED: 'file.uploaded',
} as const;

// ──────────────────────────────────────────────
// Event Payload Registry
// Maps each event to its real payload DTO fields.
// Used by the admin frontend to display available
// template variables as chips on the template editor.
// ──────────────────────────────────────────────

export const EventPayloadRegistry: Record<
  string,
  { field: string; type: string; description: string }[]
> = {
  // Auth Events
  [AppEvents.USER_SIGNED_UP]: [
    { field: 'userId', type: 'string', description: 'User ID' },
    { field: 'email', type: 'string', description: 'User email address' },
    { field: 'name', type: 'string', description: 'User display name' },
    { field: 'roleKey', type: 'string', description: 'Assigned role key' },
    { field: 'createdAt', type: 'Date', description: 'Sign-up timestamp' },
  ],
  [AppEvents.USER_LOGGED_IN]: [
    { field: 'userId', type: 'string', description: 'User ID' },
    { field: 'email', type: 'string', description: 'User email address' },
    { field: 'loggedInAt', type: 'Date', description: 'Login timestamp' },
  ],
  [AppEvents.PASSWORD_RESET]: [
    { field: 'userId', type: 'string', description: 'User ID' },
    { field: 'email', type: 'string', description: 'User email address' },
    { field: 'resetAt', type: 'Date', description: 'Password reset timestamp' },
  ],

  // System User Events
  [AppEvents.SYSTEM_USER_CREATED]: [
    { field: 'userId', type: 'string', description: 'System user ID' },
    { field: 'email', type: 'string', description: 'System user email' },
    { field: 'name', type: 'string', description: 'System user name' },
    { field: 'createdAt', type: 'Date', description: 'Creation timestamp' },
  ],
  [AppEvents.SYSTEM_USER_UPDATED]: [
    { field: 'userId', type: 'string', description: 'System user ID' },
    {
      field: 'changes',
      type: 'object',
      description: 'Changed fields key-value map',
    },
    { field: 'updatedAt', type: 'Date', description: 'Update timestamp' },
  ],

  // Attendee Events
  [AppEvents.ATTENDEE_REGISTERED]: [
    { field: 'registreeId', type: 'string', description: 'Registree ID' },
    { field: 'email', type: 'string', description: 'Attendee email' },
    { field: 'name', type: 'string', description: 'Attendee name' },
    { field: 'eventId', type: 'string', description: 'Event ID' },
    { field: 'websiteId', type: 'string', description: 'Source website ID' },
    {
      field: 'registeredAt',
      type: 'Date',
      description: 'Registration timestamp',
    },
    { field: 'registreeName', type: 'string', description: 'Registree Name' },
    { field: 'registreeEmail', type: 'string', description: 'Registree Email' },
    {
      field: 'registreePhone',
      type: 'string',
      description: 'Registree Phone Number',
    },
    {
      field: 'registreeOrg',
      type: 'string',
      description: 'Registree Organization',
    },
    { field: 'registreeCity', type: 'string', description: 'Registree City' },
    { field: 'eventTitle', type: 'string', description: 'Event Title' },
    { field: 'eventSlug', type: 'string', description: 'Event Slug' },
    {
      field: 'eventDescription',
      type: 'string',
      description: 'Event Description',
    },
    {
      field: 'eventStartDate',
      type: 'string',
      description: 'Event Start Date (IST)',
    },
    {
      field: 'eventStartTime',
      type: 'string',
      description: 'Event Start Time (IST)',
    },
    {
      field: 'eventEndDate',
      type: 'string',
      description: 'Event End Date (IST)',
    },
    {
      field: 'eventEndTime',
      type: 'string',
      description: 'Event End Time (IST)',
    },
    {
      field: 'eventLocation',
      type: 'string',
      description: 'Event Location (Venue, Address, City...)',
    },
    {
      field: 'eventMeetingLink',
      type: 'string',
      description: 'Event Meeting Link',
    },
    {
      field: 'eventBannerImage',
      type: 'string',
      description: 'Event Banner Image URL',
    },
    {
      field: 'eventSponsorsDetails',
      type: 'string',
      description: 'Event Sponsors Details Summary',
    },
    {
      field: 'eventAgendaDetails',
      type: 'string',
      description: 'Event Agenda Items Details Summary',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.ATTENDEE_APPROVED]: [
    { field: 'attendeeId', type: 'string', description: 'Attendee ID' },
    { field: 'registreeId', type: 'string', description: 'Registree ID' },
    { field: 'email', type: 'string', description: 'Attendee email' },
    { field: 'name', type: 'string', description: 'Attendee name' },
    { field: 'eventId', type: 'string', description: 'Event ID' },
    { field: 'passCode', type: 'string', description: 'Assigned pass code' },
    { field: 'approvedAt', type: 'Date', description: 'Approval timestamp' },
    { field: 'registreeName', type: 'string', description: 'Registree Name' },
    { field: 'registreeEmail', type: 'string', description: 'Registree Email' },
    {
      field: 'registreePhone',
      type: 'string',
      description: 'Registree Phone Number',
    },
    {
      field: 'registreeOrg',
      type: 'string',
      description: 'Registree Organization',
    },
    { field: 'registreeCity', type: 'string', description: 'Registree City' },
    { field: 'eventTitle', type: 'string', description: 'Event Title' },
    { field: 'eventSlug', type: 'string', description: 'Event Slug' },
    {
      field: 'eventDescription',
      type: 'string',
      description: 'Event Description',
    },
    {
      field: 'eventStartDate',
      type: 'string',
      description: 'Event Start Date (IST)',
    },
    {
      field: 'eventStartTime',
      type: 'string',
      description: 'Event Start Time (IST)',
    },
    {
      field: 'eventEndDate',
      type: 'string',
      description: 'Event End Date (IST)',
    },
    {
      field: 'eventEndTime',
      type: 'string',
      description: 'Event End Time (IST)',
    },
    {
      field: 'eventLocation',
      type: 'string',
      description: 'Event Location (Venue, Address, City...)',
    },
    {
      field: 'eventMeetingLink',
      type: 'string',
      description: 'Event Meeting Link',
    },
    {
      field: 'eventBannerImage',
      type: 'string',
      description: 'Event Banner Image URL',
    },
    {
      field: 'eventSponsorsDetails',
      type: 'string',
      description: 'Event Sponsors Details Summary',
    },
    {
      field: 'eventAgendaDetails',
      type: 'string',
      description: 'Event Agenda Items Details Summary',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.ATTENDEE_REJECTED]: [
    { field: 'registreeId', type: 'string', description: 'Registree ID' },
    { field: 'email', type: 'string', description: 'Attendee email' },
    { field: 'eventId', type: 'string', description: 'Event ID' },
    { field: 'rejectedAt', type: 'Date', description: 'Rejection timestamp' },
    { field: 'registreeName', type: 'string', description: 'Registree Name' },
    { field: 'registreeEmail', type: 'string', description: 'Registree Email' },
    {
      field: 'registreePhone',
      type: 'string',
      description: 'Registree Phone Number',
    },
    {
      field: 'registreeOrg',
      type: 'string',
      description: 'Registree Organization',
    },
    { field: 'registreeCity', type: 'string', description: 'Registree City' },
    { field: 'eventTitle', type: 'string', description: 'Event Title' },
    { field: 'eventSlug', type: 'string', description: 'Event Slug' },
    {
      field: 'eventDescription',
      type: 'string',
      description: 'Event Description',
    },
    {
      field: 'eventStartDate',
      type: 'string',
      description: 'Event Start Date (IST)',
    },
    {
      field: 'eventStartTime',
      type: 'string',
      description: 'Event Start Time (IST)',
    },
    {
      field: 'eventEndDate',
      type: 'string',
      description: 'Event End Date (IST)',
    },
    {
      field: 'eventEndTime',
      type: 'string',
      description: 'Event End Time (IST)',
    },
    {
      field: 'eventLocation',
      type: 'string',
      description: 'Event Location (Venue, Address, City...)',
    },
    {
      field: 'eventMeetingLink',
      type: 'string',
      description: 'Event Meeting Link',
    },
    {
      field: 'eventBannerImage',
      type: 'string',
      description: 'Event Banner Image URL',
    },
    {
      field: 'eventSponsorsDetails',
      type: 'string',
      description: 'Event Sponsors Details Summary',
    },
    {
      field: 'eventAgendaDetails',
      type: 'string',
      description: 'Event Agenda Items Details Summary',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.ATTENDEE_BLOCKED]: [
    { field: 'registreeId', type: 'string', description: 'Registree ID' },
    { field: 'email', type: 'string', description: 'Attendee email' },
    { field: 'eventId', type: 'string', description: 'Event ID' },
    { field: 'blockedAt', type: 'Date', description: 'Block timestamp' },
    { field: 'registreeName', type: 'string', description: 'Registree Name' },
    { field: 'registreeEmail', type: 'string', description: 'Registree Email' },
    {
      field: 'registreePhone',
      type: 'string',
      description: 'Registree Phone Number',
    },
    {
      field: 'registreeOrg',
      type: 'string',
      description: 'Registree Organization',
    },
    { field: 'registreeCity', type: 'string', description: 'Registree City' },
    { field: 'eventTitle', type: 'string', description: 'Event Title' },
    { field: 'eventSlug', type: 'string', description: 'Event Slug' },
    {
      field: 'eventDescription',
      type: 'string',
      description: 'Event Description',
    },
    {
      field: 'eventStartDate',
      type: 'string',
      description: 'Event Start Date (IST)',
    },
    {
      field: 'eventStartTime',
      type: 'string',
      description: 'Event Start Time (IST)',
    },
    {
      field: 'eventEndDate',
      type: 'string',
      description: 'Event End Date (IST)',
    },
    {
      field: 'eventEndTime',
      type: 'string',
      description: 'Event End Time (IST)',
    },
    {
      field: 'eventLocation',
      type: 'string',
      description: 'Event Location (Venue, Address, City...)',
    },
    {
      field: 'eventMeetingLink',
      type: 'string',
      description: 'Event Meeting Link',
    },
    {
      field: 'eventBannerImage',
      type: 'string',
      description: 'Event Banner Image URL',
    },
    {
      field: 'eventSponsorsDetails',
      type: 'string',
      description: 'Event Sponsors Details Summary',
    },
    {
      field: 'eventAgendaDetails',
      type: 'string',
      description: 'Event Agenda Items Details Summary',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.ATTENDEE_CHECKED_IN]: [
    { field: 'attendeeId', type: 'string', description: 'Attendee ID' },
    { field: 'email', type: 'string', description: 'Attendee email' },
    { field: 'name', type: 'string', description: 'Attendee name' },
    { field: 'eventId', type: 'string', description: 'Event ID' },
    { field: 'passCode', type: 'string', description: 'Pass code used' },
    { field: 'checkedInAt', type: 'Date', description: 'Check-in timestamp' },
    { field: 'registreeName', type: 'string', description: 'Registree Name' },
    { field: 'registreeEmail', type: 'string', description: 'Registree Email' },
    {
      field: 'registreePhone',
      type: 'string',
      description: 'Registree Phone Number',
    },
    {
      field: 'registreeOrg',
      type: 'string',
      description: 'Registree Organization',
    },
    { field: 'registreeCity', type: 'string', description: 'Registree City' },
    { field: 'eventTitle', type: 'string', description: 'Event Title' },
    { field: 'eventSlug', type: 'string', description: 'Event Slug' },
    {
      field: 'eventDescription',
      type: 'string',
      description: 'Event Description',
    },
    {
      field: 'eventStartDate',
      type: 'string',
      description: 'Event Start Date (IST)',
    },
    {
      field: 'eventStartTime',
      type: 'string',
      description: 'Event Start Time (IST)',
    },
    {
      field: 'eventEndDate',
      type: 'string',
      description: 'Event End Date (IST)',
    },
    {
      field: 'eventEndTime',
      type: 'string',
      description: 'Event End Time (IST)',
    },
    {
      field: 'eventLocation',
      type: 'string',
      description: 'Event Location (Venue, Address, City...)',
    },
    {
      field: 'eventMeetingLink',
      type: 'string',
      description: 'Event Meeting Link',
    },
    {
      field: 'eventBannerImage',
      type: 'string',
      description: 'Event Banner Image URL',
    },
    {
      field: 'eventSponsorsDetails',
      type: 'string',
      description: 'Event Sponsors Details Summary',
    },
    {
      field: 'eventAgendaDetails',
      type: 'string',
      description: 'Event Agenda Items Details Summary',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.ATTENDEE_CREATED_BY_ADMIN]: [
    { field: 'attendeeId', type: 'string', description: 'Attendee ID' },
    { field: 'email', type: 'string', description: 'Attendee email' },
    { field: 'name', type: 'string', description: 'Attendee name' },
    { field: 'eventId', type: 'string', description: 'Event ID' },
    { field: 'passCode', type: 'string', description: 'Assigned pass code' },
    { field: 'createdAt', type: 'Date', description: 'Creation timestamp' },
    { field: 'registreeName', type: 'string', description: 'Registree Name' },
    { field: 'registreeEmail', type: 'string', description: 'Registree Email' },
    {
      field: 'registreePhone',
      type: 'string',
      description: 'Registree Phone Number',
    },
    {
      field: 'registreeOrg',
      type: 'string',
      description: 'Registree Organization',
    },
    { field: 'registreeCity', type: 'string', description: 'Registree City' },
    { field: 'eventTitle', type: 'string', description: 'Event Title' },
    { field: 'eventSlug', type: 'string', description: 'Event Slug' },
    {
      field: 'eventDescription',
      type: 'string',
      description: 'Event Description',
    },
    {
      field: 'eventStartDate',
      type: 'string',
      description: 'Event Start Date (IST)',
    },
    {
      field: 'eventStartTime',
      type: 'string',
      description: 'Event Start Time (IST)',
    },
    {
      field: 'eventEndDate',
      type: 'string',
      description: 'Event End Date (IST)',
    },
    {
      field: 'eventEndTime',
      type: 'string',
      description: 'Event End Time (IST)',
    },
    {
      field: 'eventLocation',
      type: 'string',
      description: 'Event Location (Venue, Address, City...)',
    },
    {
      field: 'eventMeetingLink',
      type: 'string',
      description: 'Event Meeting Link',
    },
    {
      field: 'eventBannerImage',
      type: 'string',
      description: 'Event Banner Image URL',
    },
    {
      field: 'eventSponsorsDetails',
      type: 'string',
      description: 'Event Sponsors Details Summary',
    },
    {
      field: 'eventAgendaDetails',
      type: 'string',
      description: 'Event Agenda Items Details Summary',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],

  // Event Management Events
  [AppEvents.EVENT_CREATED]: [
    { field: 'eventId', type: 'string', description: 'Event ID' },
    { field: 'title', type: 'string', description: 'Event title' },
    { field: 'type', type: 'string', description: 'Event type' },
    { field: 'createdBy', type: 'string', description: 'Creator user ID' },
    { field: 'createdAt', type: 'Date', description: 'Creation timestamp' },
    { field: 'eventTitle', type: 'string', description: 'Event Title' },
    { field: 'eventSlug', type: 'string', description: 'Event Slug' },
    {
      field: 'eventDescription',
      type: 'string',
      description: 'Event Description',
    },
    {
      field: 'eventStartDate',
      type: 'string',
      description: 'Event Start Date (IST)',
    },
    {
      field: 'eventStartTime',
      type: 'string',
      description: 'Event Start Time (IST)',
    },
    {
      field: 'eventEndDate',
      type: 'string',
      description: 'Event End Date (IST)',
    },
    {
      field: 'eventEndTime',
      type: 'string',
      description: 'Event End Time (IST)',
    },
    {
      field: 'eventLocation',
      type: 'string',
      description: 'Event Location (Venue, Address, City...)',
    },
    {
      field: 'eventMeetingLink',
      type: 'string',
      description: 'Event Meeting Link',
    },
    {
      field: 'eventBannerImage',
      type: 'string',
      description: 'Event Banner Image URL',
    },
    {
      field: 'eventSponsorsDetails',
      type: 'string',
      description: 'Event Sponsors Details Summary',
    },
    {
      field: 'eventAgendaDetails',
      type: 'string',
      description: 'Event Agenda Items Details Summary',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.EVENT_UPDATED]: [
    { field: 'eventId', type: 'string', description: 'Event ID' },
    { field: 'title', type: 'string', description: 'Event title' },
    {
      field: 'changes',
      type: 'object',
      description: 'Changed fields key-value map',
    },
    { field: 'updatedAt', type: 'Date', description: 'Update timestamp' },
    { field: 'eventTitle', type: 'string', description: 'Event Title' },
    { field: 'eventSlug', type: 'string', description: 'Event Slug' },
    {
      field: 'eventDescription',
      type: 'string',
      description: 'Event Description',
    },
    {
      field: 'eventStartDate',
      type: 'string',
      description: 'Event Start Date (IST)',
    },
    {
      field: 'eventStartTime',
      type: 'string',
      description: 'Event Start Time (IST)',
    },
    {
      field: 'eventEndDate',
      type: 'string',
      description: 'Event End Date (IST)',
    },
    {
      field: 'eventEndTime',
      type: 'string',
      description: 'Event End Time (IST)',
    },
    {
      field: 'eventLocation',
      type: 'string',
      description: 'Event Location (Venue, Address, City...)',
    },
    {
      field: 'eventMeetingLink',
      type: 'string',
      description: 'Event Meeting Link',
    },
    {
      field: 'eventBannerImage',
      type: 'string',
      description: 'Event Banner Image URL',
    },
    {
      field: 'eventSponsorsDetails',
      type: 'string',
      description: 'Event Sponsors Details Summary',
    },
    {
      field: 'eventAgendaDetails',
      type: 'string',
      description: 'Event Agenda Items Details Summary',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.EVENT_DELETED]: [
    { field: 'eventId', type: 'string', description: 'Event ID' },
    { field: 'title', type: 'string', description: 'Event title' },
    { field: 'deletedAt', type: 'Date', description: 'Deletion timestamp' },
    { field: 'eventTitle', type: 'string', description: 'Event Title' },
    { field: 'eventSlug', type: 'string', description: 'Event Slug' },
    {
      field: 'eventDescription',
      type: 'string',
      description: 'Event Description',
    },
    {
      field: 'eventStartDate',
      type: 'string',
      description: 'Event Start Date (IST)',
    },
    {
      field: 'eventStartTime',
      type: 'string',
      description: 'Event Start Time (IST)',
    },
    {
      field: 'eventEndDate',
      type: 'string',
      description: 'Event End Date (IST)',
    },
    {
      field: 'eventEndTime',
      type: 'string',
      description: 'Event End Time (IST)',
    },
    {
      field: 'eventLocation',
      type: 'string',
      description: 'Event Location (Venue, Address, City...)',
    },
    {
      field: 'eventMeetingLink',
      type: 'string',
      description: 'Event Meeting Link',
    },
    {
      field: 'eventBannerImage',
      type: 'string',
      description: 'Event Banner Image URL',
    },
    {
      field: 'eventSponsorsDetails',
      type: 'string',
      description: 'Event Sponsors Details Summary',
    },
    {
      field: 'eventAgendaDetails',
      type: 'string',
      description: 'Event Agenda Items Details Summary',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.EVENT_REMINDER]: [
    { field: 'attendeeId', type: 'string', description: 'Attendee ID' },
    { field: 'eventId', type: 'string', description: 'Event ID' },
    { field: 'templateId', type: 'string', description: 'Template ID' },
    { field: 'sentAt', type: 'Date', description: 'Timestamp of reminder' },
  ],
  [AppEvents.EVENT_MEETING_CREATED]: [
    { field: 'meetingId', type: 'string', description: 'Meeting ID' },
    { field: 'eventId', type: 'string', description: 'Parent event ID' },
    { field: 'title', type: 'string', description: 'Meeting title' },
    { field: 'eventTitle', type: 'string', description: 'Parent event title' },
    { field: 'time', type: 'string', description: 'Meeting time' },
    { field: 'date', type: 'string', description: 'Meeting date' },
    {
      field: 'eventDetails',
      type: 'string',
      description: 'Parent event details',
    },
    { field: 'createdAt', type: 'Date', description: 'Creation timestamp' },
    { field: 'eventSlug', type: 'string', description: 'Event Slug' },
    {
      field: 'eventDescription',
      type: 'string',
      description: 'Event Description',
    },
    {
      field: 'eventStartDate',
      type: 'string',
      description: 'Event Start Date (IST)',
    },
    {
      field: 'eventStartTime',
      type: 'string',
      description: 'Event Start Time (IST)',
    },
    {
      field: 'eventEndDate',
      type: 'string',
      description: 'Event End Date (IST)',
    },
    {
      field: 'eventEndTime',
      type: 'string',
      description: 'Event End Time (IST)',
    },
    {
      field: 'eventLocation',
      type: 'string',
      description: 'Event Location (Venue, Address, City...)',
    },
    {
      field: 'eventMeetingLink',
      type: 'string',
      description: 'Event Meeting Link',
    },
    {
      field: 'eventBannerImage',
      type: 'string',
      description: 'Event Banner Image URL',
    },
    {
      field: 'eventSponsorsDetails',
      type: 'string',
      description: 'Event Sponsors Details Summary',
    },
    {
      field: 'eventAgendaDetails',
      type: 'string',
      description: 'Event Agenda Items Details Summary',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],

  // Blog Events
  [AppEvents.BLOG_CREATED]: [
    { field: 'blogId', type: 'string', description: 'Blog post ID' },
    { field: 'title', type: 'string', description: 'Blog title' },
    { field: 'authorId', type: 'string', description: 'Author user ID' },
    { field: 'createdAt', type: 'Date', description: 'Creation timestamp' },
    { field: 'blogTitle', type: 'string', description: 'Blog Title' },
    { field: 'blogSlug', type: 'string', description: 'Blog Slug' },
    { field: 'blogExcerpt', type: 'string', description: 'Blog Excerpt' },
    {
      field: 'blogFeatureImage',
      type: 'string',
      description: 'Blog Feature Image URL',
    },
    {
      field: 'blogPublishedAt',
      type: 'string',
      description: 'Blog Published At Date',
    },
    {
      field: 'blogAuthorName',
      type: 'string',
      description: 'Blog Author Name',
    },
    {
      field: 'blogAuthorEmail',
      type: 'string',
      description: 'Blog Author Email',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.BLOG_UPDATED]: [
    { field: 'blogId', type: 'string', description: 'Blog post ID' },
    { field: 'title', type: 'string', description: 'Blog title' },
    { field: 'updatedAt', type: 'Date', description: 'Update timestamp' },
    { field: 'blogTitle', type: 'string', description: 'Blog Title' },
    { field: 'blogSlug', type: 'string', description: 'Blog Slug' },
    { field: 'blogExcerpt', type: 'string', description: 'Blog Excerpt' },
    {
      field: 'blogFeatureImage',
      type: 'string',
      description: 'Blog Feature Image URL',
    },
    {
      field: 'blogPublishedAt',
      type: 'string',
      description: 'Blog Published At Date',
    },
    {
      field: 'blogAuthorName',
      type: 'string',
      description: 'Blog Author Name',
    },
    {
      field: 'blogAuthorEmail',
      type: 'string',
      description: 'Blog Author Email',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.BLOG_DELETED]: [
    { field: 'blogId', type: 'string', description: 'Blog post ID' },
    { field: 'deletedAt', type: 'Date', description: 'Deletion timestamp' },
    { field: 'blogTitle', type: 'string', description: 'Blog Title' },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.BLOG_COMMENT_ADDED]: [
    { field: 'blogId', type: 'string', description: 'Blog post ID' },
    { field: 'commentId', type: 'string', description: 'Comment ID' },
    { field: 'authorName', type: 'string', description: 'Comment author name' },
    {
      field: 'authorEmail',
      type: 'string',
      description: 'Comment author email',
    },
    { field: 'createdAt', type: 'Date', description: 'Comment timestamp' },
    { field: 'blogTitle', type: 'string', description: 'Blog Title' },
    { field: 'blogSlug', type: 'string', description: 'Blog Slug' },
    { field: 'commentContent', type: 'string', description: 'Comment Content' },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.BLOG_LIKED]: [
    { field: 'blogId', type: 'string', description: 'Blog post ID' },
    { field: 'likedAt', type: 'Date', description: 'Like timestamp' },
    { field: 'blogTitle', type: 'string', description: 'Blog Title' },
    { field: 'blogSlug', type: 'string', description: 'Blog Slug' },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],

  // Contact Events
  [AppEvents.CONTACT_SUBMITTED]: [
    {
      field: 'contactId',
      type: 'string',
      description: 'Contact submission ID',
    },
    {
      field: 'fullName',
      type: 'string',
      description: 'Full name of the submitter',
    },
    { field: 'email', type: 'string', description: 'Email of the submitter' },
    { field: 'phone', type: 'string', description: 'Phone number' },
    {
      field: 'service',
      type: 'string',
      description: 'Selected service or topic',
    },
    { field: 'message', type: 'string', description: 'Contact message body' },
    { field: 'websiteId', type: 'string', description: 'Source website ID' },
    { field: 'submittedAt', type: 'Date', description: 'Submission timestamp' },
    {
      field: 'contactName',
      type: 'string',
      description: 'Contact Submitter Full Name',
    },
    {
      field: 'contactEmail',
      type: 'string',
      description: 'Contact Submitter Email',
    },
    {
      field: 'contactPhone',
      type: 'string',
      description: 'Contact Submitter Phone',
    },
    {
      field: 'contactService',
      type: 'string',
      description: 'Contact Service/Topic',
    },
    {
      field: 'contactMessage',
      type: 'string',
      description: 'Contact Message Body',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.CONTACT_REPLIED]: [
    {
      field: 'contactId',
      type: 'string',
      description: 'Contact submission ID',
    },
    {
      field: 'email',
      type: 'string',
      description: 'Email of original submitter',
    },
    {
      field: 'repliedBy',
      type: 'string',
      description: 'Admin user ID who replied',
    },
    { field: 'repliedAt', type: 'Date', description: 'Reply timestamp' },
    {
      field: 'contactName',
      type: 'string',
      description: 'Contact Submitter Full Name',
    },
    {
      field: 'contactEmail',
      type: 'string',
      description: 'Contact Submitter Email',
    },
    {
      field: 'contactPhone',
      type: 'string',
      description: 'Contact Submitter Phone',
    },
    {
      field: 'contactService',
      type: 'string',
      description: 'Contact Service/Topic',
    },
    {
      field: 'contactMessage',
      type: 'string',
      description: 'Contact Message Body',
    },
    {
      field: 'contactReplyMessage',
      type: 'string',
      description: 'Contact Reply Message',
    },
    {
      field: 'contactRepliedAt',
      type: 'string',
      description: 'Contact Reply Date',
    },
    {
      field: 'contactRepliedByName',
      type: 'string',
      description: 'Admin Replied User Name',
    },
    {
      field: 'contactRepliedByEmail',
      type: 'string',
      description: 'Admin Replied User Email',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.SUBSCRIBER_SUBSCRIBED]: [
    { field: 'subscriberId', type: 'string', description: 'Subscriber record ID' },
    { field: 'email', type: 'string', description: 'Subscriber email address' },
    { field: 'websiteId', type: 'string', description: 'Website ID' },
    { field: 'source', type: 'string', description: 'Subscription source' },
    { field: 'subscribedAt', type: 'Date', description: 'Subscription timestamp' },
  ],
  [AppEvents.SUBSCRIBER_BULK_EMAIL_SENT]: [
    { field: 'websiteId', type: 'string', description: 'Website ID when scoped' },
    { field: 'subject', type: 'string', description: 'Bulk email subject' },
    { field: 'recipientCount', type: 'number', description: 'Recipient count' },
    { field: 'sentTo', type: 'string[]', description: 'Recipient email list' },
    { field: 'sentAt', type: 'Date', description: 'Bulk send timestamp' },
  ],

  // Sponsor Events
  [AppEvents.SPONSOR_CREATED]: [
    { field: 'sponsorId', type: 'string', description: 'Sponsor ID' },
    { field: 'name', type: 'string', description: 'Sponsor name' },
    { field: 'createdAt', type: 'Date', description: 'Creation timestamp' },
    { field: 'sponsorName', type: 'string', description: 'Sponsor Name' },
    { field: 'sponsorCompany', type: 'string', description: 'Sponsor Company' },
    { field: 'sponsorEmail', type: 'string', description: 'Sponsor Email' },
    { field: 'sponsorPhone', type: 'string', description: 'Sponsor Phone' },
    { field: 'sponsorWebsite', type: 'string', description: 'Sponsor Website' },
    { field: 'sponsorType', type: 'string', description: 'Sponsor Type' },
    { field: 'sponsorTier', type: 'string', description: 'Sponsor Tier' },
    {
      field: 'sponsorDescription',
      type: 'string',
      description: 'Sponsor Description',
    },
  ],
  [AppEvents.SPONSOR_UPDATED]: [
    { field: 'sponsorId', type: 'string', description: 'Sponsor ID' },
    { field: 'name', type: 'string', description: 'Sponsor name' },
    { field: 'updatedAt', type: 'Date', description: 'Update timestamp' },
    { field: 'sponsorName', type: 'string', description: 'Sponsor Name' },
    { field: 'sponsorCompany', type: 'string', description: 'Sponsor Company' },
    { field: 'sponsorEmail', type: 'string', description: 'Sponsor Email' },
    { field: 'sponsorPhone', type: 'string', description: 'Sponsor Phone' },
    { field: 'sponsorWebsite', type: 'string', description: 'Sponsor Website' },
    { field: 'sponsorType', type: 'string', description: 'Sponsor Type' },
    { field: 'sponsorTier', type: 'string', description: 'Sponsor Tier' },
    {
      field: 'sponsorDescription',
      type: 'string',
      description: 'Sponsor Description',
    },
  ],
  [AppEvents.SPONSOR_DELETED]: [
    { field: 'sponsorId', type: 'string', description: 'Sponsor ID' },
    { field: 'deletedAt', type: 'Date', description: 'Deletion timestamp' },
    { field: 'sponsorName', type: 'string', description: 'Sponsor Name' },
  ],

  // Nomination Events
  [AppEvents.NOMINATION_SUBMITTED]: [
    { field: 'nominationId', type: 'string', description: 'Nomination ID' },
    {
      field: 'categoryId',
      type: 'string',
      description: 'Nomination category ID',
    },
    {
      field: 'nomineeName',
      type: 'string',
      description: 'Name of the nominee',
    },
    {
      field: 'submittedBy',
      type: 'string',
      description: 'Submitter identifier',
    },
    { field: 'websiteId', type: 'string', description: 'Source website ID' },
    { field: 'submittedAt', type: 'Date', description: 'Submission timestamp' },
    { field: 'nominatorName', type: 'string', description: 'Nominator Name' },
    { field: 'nominatorEmail', type: 'string', description: 'Nominator Email' },
    { field: 'nominatorPhone', type: 'string', description: 'Nominator Phone' },
    {
      field: 'nominatorOrg',
      type: 'string',
      description: 'Nominator Organization',
    },
    { field: 'nominatorCity', type: 'string', description: 'Nominator City' },
    {
      field: 'nomineeDetails',
      type: 'string',
      description: 'Nominees List Detail Summary',
    },
    {
      field: 'nominationStatus',
      type: 'string',
      description: 'Nomination Status',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.NOMINATION_STATUS_CHANGED]: [
    { field: 'nominationId', type: 'string', description: 'Nomination ID' },
    {
      field: 'previousStatus',
      type: 'string',
      description: 'Previous status value',
    },
    { field: 'newStatus', type: 'string', description: 'New status value' },
    {
      field: 'changedAt',
      type: 'Date',
      description: 'Status change timestamp',
    },
    { field: 'nominatorName', type: 'string', description: 'Nominator Name' },
    { field: 'nominatorEmail', type: 'string', description: 'Nominator Email' },
    { field: 'nominatorPhone', type: 'string', description: 'Nominator Phone' },
    {
      field: 'nominatorOrg',
      type: 'string',
      description: 'Nominator Organization',
    },
    { field: 'nominatorCity', type: 'string', description: 'Nominator City' },
    {
      field: 'nomineeDetails',
      type: 'string',
      description: 'Nominees List Detail Summary',
    },
    {
      field: 'nominationStatus',
      type: 'string',
      description: 'Nomination Status',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],

  // Website Events
  [AppEvents.WEBSITE_CREATED]: [
    { field: 'websiteId', type: 'string', description: 'Website ID' },
    { field: 'name', type: 'string', description: 'Website name' },
    { field: 'domain', type: 'string', description: 'Website domain' },
    { field: 'createdAt', type: 'Date', description: 'Creation timestamp' },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteSlug', type: 'string', description: 'Website Slug' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    {
      field: 'websiteDescription',
      type: 'string',
      description: 'Website Description',
    },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo URL' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.WEBSITE_UPDATED]: [
    { field: 'websiteId', type: 'string', description: 'Website ID' },
    { field: 'name', type: 'string', description: 'Website name' },
    {
      field: 'changes',
      type: 'object',
      description: 'Changed fields key-value map',
    },
    { field: 'updatedAt', type: 'Date', description: 'Update timestamp' },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteSlug', type: 'string', description: 'Website Slug' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    {
      field: 'websiteDescription',
      type: 'string',
      description: 'Website Description',
    },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo URL' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.WEBSITE_PAGE_PUBLISHED]: [
    { field: 'pageId', type: 'string', description: 'Page ID' },
    { field: 'websiteId', type: 'string', description: 'Website ID' },
    { field: 'slug', type: 'string', description: 'Page slug' },
    { field: 'publishedBy', type: 'string', description: 'Publisher user ID' },
    { field: 'publishedAt', type: 'Date', description: 'Publish timestamp' },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteSlug', type: 'string', description: 'Website Slug' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    {
      field: 'websiteDescription',
      type: 'string',
      description: 'Website Description',
    },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo URL' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],

  // Report Events
  [AppEvents.REPORT_CREATED]: [
    { field: 'reportId', type: 'string', description: 'Report ID' },
    { field: 'title', type: 'string', description: 'Report title' },
    { field: 'createdBy', type: 'string', description: 'Creator user ID' },
    { field: 'createdAt', type: 'Date', description: 'Creation timestamp' },
    { field: 'reportTitle', type: 'string', description: 'Report Title' },
    { field: 'reportSlug', type: 'string', description: 'Report Slug' },
    {
      field: 'reportDescription',
      type: 'string',
      description: 'Report Description',
    },
    {
      field: 'reportDownloadCount',
      type: 'number',
      description: 'Report Download Count',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
  ],
  [AppEvents.REPORT_DOWNLOADED]: [
    { field: 'reportId', type: 'string', description: 'Report ID' },
    {
      field: 'downloadedBy',
      type: 'string',
      description: 'Downloader user ID',
    },
    { field: 'websiteId', type: 'string', description: 'Website ID' },
    { field: 'downloadedAt', type: 'Date', description: 'Download timestamp' },
    { field: 'reportTitle', type: 'string', description: 'Report Title' },
    { field: 'reportSlug', type: 'string', description: 'Report Slug' },
    {
      field: 'reportDescription',
      type: 'string',
      description: 'Report Description',
    },
    {
      field: 'reportDownloadCount',
      type: 'number',
      description: 'Report Download Count',
    },
    { field: 'websiteName', type: 'string', description: 'Website Name' },
    { field: 'websiteDomain', type: 'string', description: 'Website Domain' },
    { field: 'websiteLogo', type: 'string', description: 'Website Logo' },
    {
      field: 'websiteOgImage',
      type: 'string',
      description: 'Website OG Image',
    },
    {
      field: 'downloadUrl',
      type: 'string',
      description: 'Download link for the report',
    },
  ],

  // Communication Events
  [AppEvents.COMMUNICATION_DISPATCHED]: [
    { field: 'logId', type: 'string', description: 'Communication log ID' },
    {
      field: 'channel',
      type: 'string',
      description: 'Communication channel (email/sms/push)',
    },
    { field: 'recipient', type: 'string', description: 'Recipient identifier' },
    {
      field: 'templateSlug',
      type: 'string',
      description: 'Template slug if template-based',
    },
    { field: 'dispatchedAt', type: 'Date', description: 'Dispatch timestamp' },
  ],

  // File Events
  [AppEvents.FILE_UPLOADED]: [
    { field: 'fileId', type: 'string', description: 'File ID' },
    { field: 'filename', type: 'string', description: 'Original filename' },
    { field: 'mimetype', type: 'string', description: 'File MIME type' },
    { field: 'size', type: 'number', description: 'File size in bytes' },
    { field: 'uploadedBy', type: 'string', description: 'Uploader user ID' },
    { field: 'uploadedAt', type: 'Date', description: 'Upload timestamp' },
  ],
};

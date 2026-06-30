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

  // Blogs
  BLOG_CREATED: 'blog.created',
  BLOG_UPDATED: 'blog.updated',
  BLOG_DELETED: 'blog.deleted',
  BLOG_COMMENT_ADDED: 'blog.comment_added',
  BLOG_LIKED: 'blog.liked',

  // Contacts
  CONTACT_SUBMITTED: 'contact.submitted',
  CONTACT_REPLIED: 'contact.replied',

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

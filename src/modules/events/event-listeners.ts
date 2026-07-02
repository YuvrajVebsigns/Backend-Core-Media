import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  UserSignedUpEvent,
  UserLoggedInEvent,
  PasswordResetEvent,
  SystemUserCreatedEvent,
  SystemUserUpdatedEvent,
  AttendeeRegisteredEvent,
  AttendeeApprovedEvent,
  AttendeeRejectedEvent,
  AttendeeBlockedEvent,
  AttendeeCheckedInEvent,
  AttendeeCreatedByAdminEvent,
  EventCreatedEvent,
  EventUpdatedEvent,
  EventDeletedEvent,
  EventMeetingCreatedEvent,
  BlogCreatedEvent,
  BlogUpdatedEvent,
  BlogDeletedEvent,
  BlogCommentAddedEvent,
  BlogLikedEvent,
  ContactSubmittedEvent,
  ContactRepliedEvent,
  SponsorCreatedEvent,
  SponsorUpdatedEvent,
  SponsorDeletedEvent,
  NominationSubmittedEvent,
  NominationStatusChangedEvent,
  WebsiteCreatedEvent,
  WebsiteUpdatedEvent,
  WebsitePagePublishedEvent,
  ReportCreatedEvent,
  ReportDownloadedEvent,
  CommunicationDispatchedEvent,
  FileUploadedEvent,
  AppEvents,
} from './event-definitions';
import { CommunicationsService } from '../communications/communications.service';
import { SystemUsersService } from '@core/system-users/system-users.service';

@Injectable()
export class EventListeners {
  private readonly logger = new Logger(EventListeners.name);

  constructor(
    private readonly communicationsService: CommunicationsService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  private async triggerMappedEvent(eventName: string, payload: any) {
    try {
      const mapping =
        await this.communicationsService.findEventMappingByEvent(eventName);
      if (!mapping || !mapping.isActive) {
        this.logger.debug(
          `No active event mapping found for event: ${eventName}`,
        );
        return;
      }

      const template = mapping.templateId as any;
      if (!template) {
        this.logger.warn(`Template not found for event mapping: ${eventName}`);
        return;
      }

      // Resolve recipient
      let recipient = '';
      if (payload.email) {
        recipient = payload.email;
      } else if (payload.recipient) {
        recipient = payload.recipient;
      } else if (payload.authorEmail) {
        recipient = payload.authorEmail;
      } else if (payload.downloadedBy && payload.downloadedBy.includes('@')) {
        recipient = payload.downloadedBy;
      } else if (payload.submittedBy && payload.submittedBy.includes('@')) {
        recipient = payload.submittedBy;
      } else if (payload.userId) {
        const user = await this.systemUsersService.findOne(payload.userId);
        if (user) {
          recipient = user.email;
        }
      } else if (payload.createdBy) {
        try {
          const user = await this.systemUsersService.findOne(payload.createdBy);
          if (user) {
            recipient = user.email;
          }
        } catch {}
      }

      if (!recipient) {
        this.logger.warn(
          `Could not resolve a recipient email for event ${eventName}. Payload: ${JSON.stringify(payload)}`,
        );
        return;
      }

      // Format date and time
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Determine a friendly eventDetails if not present
      let eventDetails = '';
      if (payload.message) {
        eventDetails = payload.message;
      } else if (payload.changes) {
        eventDetails = `Updated fields: ${Object.keys(payload.changes).join(', ')}`;
      }

      // Convert class instance to plain object to allow safe modification
      const rawPayloadObj =
        payload && typeof payload.toObject === 'function'
          ? payload.toObject()
          : JSON.parse(JSON.stringify(payload));

      const enrichedParams = {
        ...rawPayloadObj,
        eventTitle:
          rawPayloadObj.eventTitle ||
          rawPayloadObj.title ||
          rawPayloadObj.eventName ||
          eventName,
        eventDetails:
          rawPayloadObj.eventDetails ||
          rawPayloadObj.details ||
          eventDetails ||
          '',
        date: rawPayloadObj.date || dateStr,
        time: rawPayloadObj.time || timeStr,
      };

      this.logger.log(
        `Dispatching template "${template.slug}" for event: ${eventName} to: ${recipient}`,
      );
      await this.communicationsService.dispatchTemplateMessage({
        slug: template.slug,
        recipient,
        params: enrichedParams,
        senderEmail: mapping.senderEmail,
        senderName: mapping.senderName,
      });
    } catch (err) {
      this.logger.error(
        `Error processing event-template mapping for event ${eventName}: ${err.message}`,
      );
    }
  }

  // ──────────────────────────────────────────────
  // Auth Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.USER_SIGNED_UP)
  handleUserSignedUp(event: UserSignedUpEvent) {
    this.logger.log(
      `📧 New user signed up: ${event.email} (ID: ${event.userId})`,
    );
    this.triggerMappedEvent(AppEvents.USER_SIGNED_UP, event);
  }

  @OnEvent(AppEvents.USER_LOGGED_IN)
  handleUserLoggedIn(event: UserLoggedInEvent) {
    this.logger.log(`🔑 User logged in: ${event.email} (ID: ${event.userId})`);
    this.triggerMappedEvent(AppEvents.USER_LOGGED_IN, event);
  }

  @OnEvent(AppEvents.PASSWORD_RESET)
  handlePasswordReset(event: PasswordResetEvent) {
    this.logger.log(
      `🔒 Password reset for: ${event.email} (ID: ${event.userId})`,
    );
    this.triggerMappedEvent(AppEvents.PASSWORD_RESET, event);
  }

  // ──────────────────────────────────────────────
  // System User Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.SYSTEM_USER_CREATED)
  handleSystemUserCreated(event: SystemUserCreatedEvent) {
    this.logger.log(
      `👤 System user created: ${event.email} (ID: ${event.userId})`,
    );
    this.triggerMappedEvent(AppEvents.SYSTEM_USER_CREATED, event);
  }

  @OnEvent(AppEvents.SYSTEM_USER_UPDATED)
  handleSystemUserUpdated(event: SystemUserUpdatedEvent) {
    this.logger.log(`✏️ System user updated: ${event.userId}`);
    this.triggerMappedEvent(AppEvents.SYSTEM_USER_UPDATED, event);
  }

  // ──────────────────────────────────────────────
  // Attendee Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.ATTENDEE_REGISTERED)
  handleAttendeeRegistered(event: AttendeeRegisteredEvent) {
    this.logger.log(
      `📋 Attendee registered: ${event.email} for event ${event.eventId}`,
    );
    this.triggerMappedEvent(AppEvents.ATTENDEE_REGISTERED, event);
  }

  @OnEvent(AppEvents.ATTENDEE_APPROVED)
  handleAttendeeApproved(event: AttendeeApprovedEvent) {
    this.logger.log(
      `✅ Attendee approved: ${event.email} for event ${event.eventId} (Pass: ${event.passCode})`,
    );
    this.triggerMappedEvent(AppEvents.ATTENDEE_APPROVED, event);
  }

  @OnEvent(AppEvents.ATTENDEE_REJECTED)
  handleAttendeeRejected(event: AttendeeRejectedEvent) {
    this.logger.log(
      `❌ Attendee rejected: ${event.email} for event ${event.eventId}`,
    );
    this.triggerMappedEvent(AppEvents.ATTENDEE_REJECTED, event);
  }

  @OnEvent(AppEvents.ATTENDEE_BLOCKED)
  handleAttendeeBlocked(event: AttendeeBlockedEvent) {
    this.logger.log(
      `🚫 Attendee blocked: ${event.email} for event ${event.eventId}`,
    );
    this.triggerMappedEvent(AppEvents.ATTENDEE_BLOCKED, event);
  }

  @OnEvent(AppEvents.ATTENDEE_CHECKED_IN)
  handleAttendeeCheckedIn(event: AttendeeCheckedInEvent) {
    this.logger.log(
      `🎫 Attendee checked in: ${event.name} (${event.passCode}) at event ${event.eventId}`,
    );
    this.triggerMappedEvent(AppEvents.ATTENDEE_CHECKED_IN, event);
  }

  @OnEvent(AppEvents.ATTENDEE_CREATED_BY_ADMIN)
  handleAttendeeCreatedByAdmin(event: AttendeeCreatedByAdminEvent) {
    this.logger.log(
      `➕ Attendee created by admin: ${event.email} for event ${event.eventId}`,
    );
    this.triggerMappedEvent(AppEvents.ATTENDEE_CREATED_BY_ADMIN, event);
  }

  // ──────────────────────────────────────────────
  // Event Management Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.EVENT_CREATED)
  handleEventCreated(event: EventCreatedEvent) {
    this.logger.log(
      `🎉 Event created: "${event.title}" (ID: ${event.eventId})`,
    );
    this.triggerMappedEvent(AppEvents.EVENT_CREATED, event);
  }

  @OnEvent(AppEvents.EVENT_UPDATED)
  handleEventUpdated(event: EventUpdatedEvent) {
    this.logger.log(
      `✏️ Event updated: "${event.title}" (ID: ${event.eventId})`,
    );
    this.triggerMappedEvent(AppEvents.EVENT_UPDATED, event);
  }

  @OnEvent(AppEvents.EVENT_DELETED)
  handleEventDeleted(event: EventDeletedEvent) {
    this.logger.log(
      `🗑️ Event deleted: "${event.title}" (ID: ${event.eventId})`,
    );
    this.triggerMappedEvent(AppEvents.EVENT_DELETED, event);
  }

  @OnEvent(AppEvents.EVENT_MEETING_CREATED)
  handleEventMeetingCreated(event: EventMeetingCreatedEvent) {
    this.logger.log(
      `📅 Meeting created: "${event.title}" for event ${event.eventId}`,
    );
    this.triggerMappedEvent(AppEvents.EVENT_MEETING_CREATED, event);
  }

  // ──────────────────────────────────────────────
  // Blog Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.BLOG_CREATED)
  handleBlogCreated(event: BlogCreatedEvent) {
    this.logger.log(`📝 Blog created: "${event.title}" by ${event.authorId}`);
    this.triggerMappedEvent(AppEvents.BLOG_CREATED, event);
  }

  @OnEvent(AppEvents.BLOG_UPDATED)
  handleBlogUpdated(event: BlogUpdatedEvent) {
    this.logger.log(`✏️ Blog updated: "${event.title}" (ID: ${event.blogId})`);
    this.triggerMappedEvent(AppEvents.BLOG_UPDATED, event);
  }

  @OnEvent(AppEvents.BLOG_DELETED)
  handleBlogDeleted(event: BlogDeletedEvent) {
    this.logger.log(`🗑️ Blog deleted: ${event.blogId}`);
    this.triggerMappedEvent(AppEvents.BLOG_DELETED, event);
  }

  @OnEvent(AppEvents.BLOG_COMMENT_ADDED)
  handleBlogCommentAdded(event: BlogCommentAddedEvent) {
    this.logger.log(
      `💬 Comment added on blog ${event.blogId} by ${event.authorName}`,
    );
    this.triggerMappedEvent(AppEvents.BLOG_COMMENT_ADDED, event);
  }

  @OnEvent(AppEvents.BLOG_LIKED)
  handleBlogLiked(event: BlogLikedEvent) {
    this.logger.log(`❤️ Blog liked: ${event.blogId}`);
    this.triggerMappedEvent(AppEvents.BLOG_LIKED, event);
  }

  // ──────────────────────────────────────────────
  // Contact Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.CONTACT_SUBMITTED)
  handleContactSubmitted(event: ContactSubmittedEvent) {
    this.logger.log(
      `📩 Contact submitted by ${event.fullName} (${event.email})`,
    );
    this.triggerMappedEvent(AppEvents.CONTACT_SUBMITTED, event);
  }

  @OnEvent(AppEvents.CONTACT_REPLIED)
  handleContactReplied(event: ContactRepliedEvent) {
    this.logger.log(
      `📨 Contact replied to ${event.email} by ${event.repliedBy}`,
    );
    this.triggerMappedEvent(AppEvents.CONTACT_REPLIED, event);
  }

  // ──────────────────────────────────────────────
  // Sponsor Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.SPONSOR_CREATED)
  handleSponsorCreated(event: SponsorCreatedEvent) {
    this.logger.log(
      `🏢 Sponsor created: "${event.name}" (ID: ${event.sponsorId})`,
    );
    this.triggerMappedEvent(AppEvents.SPONSOR_CREATED, event);
  }

  @OnEvent(AppEvents.SPONSOR_UPDATED)
  handleSponsorUpdated(event: SponsorUpdatedEvent) {
    this.logger.log(
      `✏️ Sponsor updated: "${event.name}" (ID: ${event.sponsorId})`,
    );
    this.triggerMappedEvent(AppEvents.SPONSOR_UPDATED, event);
  }

  @OnEvent(AppEvents.SPONSOR_DELETED)
  handleSponsorDeleted(event: SponsorDeletedEvent) {
    this.logger.log(`🗑️ Sponsor deleted: ${event.sponsorId}`);
    this.triggerMappedEvent(AppEvents.SPONSOR_DELETED, event);
  }

  // ──────────────────────────────────────────────
  // Nomination Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.NOMINATION_SUBMITTED)
  handleNominationSubmitted(event: NominationSubmittedEvent) {
    this.logger.log(
      `🏆 Nomination submitted: "${event.nomineeName}" in category ${event.categoryId}`,
    );
    this.triggerMappedEvent(AppEvents.NOMINATION_SUBMITTED, event);
  }

  @OnEvent(AppEvents.NOMINATION_STATUS_CHANGED)
  handleNominationStatusChanged(event: NominationStatusChangedEvent) {
    this.logger.log(
      `🔄 Nomination status changed: ${event.nominationId} (${event.previousStatus} → ${event.newStatus})`,
    );
    this.triggerMappedEvent(AppEvents.NOMINATION_STATUS_CHANGED, event);
  }

  // ──────────────────────────────────────────────
  // Website Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.WEBSITE_CREATED)
  handleWebsiteCreated(event: WebsiteCreatedEvent) {
    this.logger.log(`🌐 Website created: "${event.name}" (${event.domain})`);
    this.triggerMappedEvent(AppEvents.WEBSITE_CREATED, event);
  }

  @OnEvent(AppEvents.WEBSITE_UPDATED)
  handleWebsiteUpdated(event: WebsiteUpdatedEvent) {
    this.logger.log(
      `✏️ Website updated: "${event.name}" (ID: ${event.websiteId})`,
    );
    this.triggerMappedEvent(AppEvents.WEBSITE_UPDATED, event);
  }

  @OnEvent(AppEvents.WEBSITE_PAGE_PUBLISHED)
  handleWebsitePagePublished(event: WebsitePagePublishedEvent) {
    this.logger.log(
      `📄 Page published: "${event.slug}" on website ${event.websiteId}`,
    );
    this.triggerMappedEvent(AppEvents.WEBSITE_PAGE_PUBLISHED, event);
  }

  // ──────────────────────────────────────────────
  // Report Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.REPORT_CREATED)
  handleReportCreated(event: ReportCreatedEvent) {
    this.logger.log(
      `📊 Report created: "${event.title}" by ${event.createdBy}`,
    );
    this.triggerMappedEvent(AppEvents.REPORT_CREATED, event);
  }

  @OnEvent(AppEvents.REPORT_DOWNLOADED)
  handleReportDownloaded(event: ReportDownloadedEvent) {
    this.logger.log(`⬇️ Report downloaded: ${event.reportId}`);
    this.triggerMappedEvent(AppEvents.REPORT_DOWNLOADED, event);
  }

  // ──────────────────────────────────────────────
  // Communication Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.COMMUNICATION_DISPATCHED)
  handleCommunicationDispatched(event: CommunicationDispatchedEvent) {
    this.logger.log(
      `📤 Communication dispatched via ${event.channel} to ${event.recipient}`,
    );
    this.triggerMappedEvent(AppEvents.COMMUNICATION_DISPATCHED, event);
  }

  // ──────────────────────────────────────────────
  // File Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.FILE_UPLOADED)
  handleFileUploaded(event: FileUploadedEvent) {
    this.logger.log(
      `📁 File uploaded: ${event.filename} (${(event.size / 1024).toFixed(1)} KB)`,
    );
    this.triggerMappedEvent(AppEvents.FILE_UPLOADED, event);
  }
}

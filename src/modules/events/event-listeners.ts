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
  SubscriberSubscribedEvent,
  SubscriberBulkEmailSentEvent,
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
  EventReminderEvent,
  AppEvents,
} from './event-definitions';
import { CommunicationsService } from '../communications/communications.service';
import { TemplateService } from '../communications/services/template.service';
import { SystemUsersService } from '@core/system-users/system-users.service';
import { AttendeesService } from '../attendees/attendees.service';
import { EventsService } from '../event-management/event-management.service';
import { BlogsService } from '../blogs/blogs.service';
import { ContactsService } from '../contacts/contacts.service';
import { NominationsService } from '../nominations/nominations.service';
import { WebsitesService } from '../websites/websites.service';
import { ReportsService } from '../reports/reports.service';
import { SponsorsService } from '../sponsors/sponsors.service';
import { VariableResolverService } from '../communications/services/variable-resolver.service';

@Injectable()
export class EventListeners {
  private readonly logger = new Logger(EventListeners.name);

  constructor(
    private readonly communicationsService: CommunicationsService,
    private readonly templateService: TemplateService,
    private readonly systemUsersService: SystemUsersService,
    private readonly attendeesService: AttendeesService,
    private readonly eventsService: EventsService,
    private readonly blogsService: BlogsService,
    private readonly contactsService: ContactsService,
    private readonly nominationsService: NominationsService,
    private readonly websitesService: WebsitesService,
    private readonly reportsService: ReportsService,
    private readonly sponsorsService: SponsorsService,
    private readonly variableResolverService: VariableResolverService,
  ) {}

  private async triggerMappedEvent(eventName: string, payload: any) {
    try {
      let mappings =
        await this.communicationsService.findEventMappingsByEvent(eventName);

      if ((!mappings || mappings.length === 0) && payload.templateId) {
        try {
          const template = await this.templateService.findOne(payload.templateId);
          if (template) {
            mappings = [
              {
                event: eventName,
                triggers: [
                  {
                    channel: template.channel,
                    templateId: template,
                    to: 'registreeEmail, email',
                    senderEmail: template.senderEmail,
                    senderName: template.senderName,
                    isActive: true,
                  },
                ],
                isActive: true,
              } as any,
            ];
          }
        } catch (err) {
          this.logger.error(
            `Error resolving explicit templateId ${payload.templateId}: ${err.message}`,
          );
        }
      }

      if (!mappings || mappings.length === 0) {
        this.logger.debug(
          `No active event mappings found for event: ${eventName}`,
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

      // Enrich with Registree details if registreeId is present (or via attendeeId fallback)
      let resolvedRegistreeId = payload.registreeId;
      let resolvedAttendee: any = null;

      if (!resolvedRegistreeId && payload.attendeeId) {
        try {
          const registree = await this.attendeesService
            .findOneRegistree(payload.attendeeId)
            .catch(() => null);
          if (registree) {
            resolvedRegistreeId = registree._id.toString();
          } else {
            resolvedAttendee = await this.attendeesService.findOne(
              payload.attendeeId,
            );
            if (resolvedAttendee && resolvedAttendee.registreeId) {
              resolvedRegistreeId = resolvedAttendee.registreeId.toString();
            }
          }
        } catch {}
      }

      if (!resolvedRegistreeId) {
        const potentialEmail = payload.downloadedBy || payload.email;
        if (potentialEmail && typeof potentialEmail === 'string' && potentialEmail.includes('@')) {
          try {
            const registree = await this.attendeesService.findRegistreeByEmail(potentialEmail);
            if (registree) {
              resolvedRegistreeId = registree._id.toString();
            }
          } catch {}
        }
      }

      if (resolvedRegistreeId) {
        try {
          const registree =
            await this.attendeesService.findOneRegistree(resolvedRegistreeId);
          if (registree) {
            const registreeObj =
              typeof registree.toObject === 'function'
                ? registree.toObject()
                : JSON.parse(JSON.stringify(registree));
            Object.assign(enrichedParams, registreeObj);

            enrichedParams.registreeName = registree.name;
            enrichedParams.registreeEmail = registree.email;
            enrichedParams.registreePhone = registree.phoneNumber || '';
            enrichedParams.registreeOrg = registree.organization || '';
            enrichedParams.registreeCity = registree.city || '';
          }
        } catch (e) {
          this.logger.error(
            `Error resolving registree details for templates: ${e.message}`,
          );
        }
      }

      // Fallback for registree details using attendee direct fields if not already populated
      if (payload.attendeeId) {
        try {
          if (!resolvedAttendee) {
            resolvedAttendee = await this.attendeesService.findOne(
              payload.attendeeId,
            );
          }
          if (resolvedAttendee) {
            if (!enrichedParams.registreeName)
              enrichedParams.registreeName = resolvedAttendee.name;
            if (!enrichedParams.registreeEmail)
              enrichedParams.registreeEmail = resolvedAttendee.email;
            if (!enrichedParams.registreePhone)
              enrichedParams.registreePhone =
                resolvedAttendee.phoneNumber || '';
            if (!enrichedParams.registreeOrg)
              enrichedParams.registreeOrg = resolvedAttendee.organization || '';
            if (!enrichedParams.registreeCity)
              enrichedParams.registreeCity = '';
          }
        } catch {}
      }

      // Enrich with Event details if eventId is present
      if (payload.eventId) {
        try {
          const event = await this.eventsService.findOne(payload.eventId);
          if (event) {
            const eventObj =
              typeof event.toObject === 'function'
                ? event.toObject()
                : JSON.parse(JSON.stringify(event));
            Object.assign(enrichedParams, eventObj);

            const loc = event.location;
            const formattedLocation = loc
              ? [loc.address, loc.city].filter(Boolean).join(', ')
              : '';

            const optionsDate: Intl.DateTimeFormatOptions = {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            };

            const optionsTime: Intl.DateTimeFormatOptions = {
              timeZone: 'Asia/Kolkata',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            };

            const formatterDate = new Intl.DateTimeFormat('en-US', optionsDate);
            const formatterTime = new Intl.DateTimeFormat('en-US', optionsTime);

            enrichedParams.eventTitle = event.title;
            enrichedParams.eventSlug = event.slug;
            enrichedParams.eventDescription = event.description;
            enrichedParams.eventStartDate = formatterDate.format(
              new Date(event.startDate),
            );
            enrichedParams.eventStartTime = formatterTime.format(
              new Date(event.startDate),
            );
            enrichedParams.eventEndDate = formatterDate.format(
              new Date(event.endDate),
            );
            enrichedParams.eventEndTime = formatterTime.format(
              new Date(event.endDate),
            );
            enrichedParams.eventLocation = formattedLocation;
            enrichedParams.eventMeetingLink = event.meetingLink || '';
            enrichedParams.eventBannerImage = event.bannerImage || '';

            if (event.sponsors && event.sponsors.length > 0) {
              enrichedParams.eventSponsorsDetails = event.sponsors
                .map((s: any) => {
                  const sponsorName = s.name || s.companyName || '';
                  const tier = s.tier ? ` (Tier: ${s.tier})` : '';
                  return `${sponsorName}${tier}`;
                })
                .filter(Boolean)
                .join(', ');
            } else {
              enrichedParams.eventSponsorsDetails = '';
            }

            if (event.agenda && event.agenda.length > 0) {
              enrichedParams.eventAgendaDetails = event.agenda
                .map((item: any) => {
                  const speakerInfo = item.speaker ? ` by ${item.speaker}` : '';
                  const desc = item.description ? `: ${item.description}` : '';
                  return `[${item.time}] ${item.title}${speakerInfo}${desc}`;
                })
                .join('\n');
            } else {
              enrichedParams.eventAgendaDetails = '';
            }

            if (event.websites && event.websites.length > 0) {
              try {
                const siteId = event.websites[0];
                const site = await this.websitesService.findOne(
                  siteId.toString(),
                );
                if (site) {
                  enrichedParams.websiteName = site.name;
                  enrichedParams.websiteDomain = site.domain;
                  enrichedParams.websiteLogo = site.logo || '';
                  enrichedParams.websiteOgImage = site.seo?.ogImage || '';
                }
              } catch {}
            }
          }
        } catch (e) {
          this.logger.error(
            `Error resolving event details for templates: ${e.message}`,
          );
        }
      }

      // Enrich with Blog details if blogId is present
      if (payload.blogId) {
        try {
          const blog = await this.blogsService.findOne(payload.blogId);
          if (blog) {
            const blogObj =
              typeof blog.toObject === 'function'
                ? blog.toObject()
                : JSON.parse(JSON.stringify(blog));
            Object.assign(enrichedParams, blogObj);

            enrichedParams.blogTitle = blog.title;
            enrichedParams.blogSlug = blog.slug;
            enrichedParams.blogExcerpt = blog.excerpt || '';
            enrichedParams.blogFeatureImage = blog.featureImage || '';
            enrichedParams.blogPublishedAt = blog.publishedAt
              ? new Date(blog.publishedAt).toLocaleDateString()
              : '';

            if (blog.author) {
              try {
                const author = await this.systemUsersService.findOne(
                  blog.author.toString(),
                );
                if (author) {
                  enrichedParams.blogAuthorName = author.fullName;
                  enrichedParams.blogAuthorEmail = author.email;
                }
              } catch {}
            }

            if (blog.websites && blog.websites.length > 0) {
              try {
                const siteId = blog.websites[0];
                const site = await this.websitesService.findOne(
                  siteId.toString(),
                );
                if (site) {
                  enrichedParams.websiteName = site.name;
                  enrichedParams.websiteDomain = site.domain;
                  enrichedParams.websiteLogo = site.logo || '';
                  enrichedParams.websiteOgImage = site.seo?.ogImage || '';
                }
              } catch {}
            }
          }
        } catch (e) {
          this.logger.error(`Error resolving blog details: ${e.message}`);
        }
      }

      // Enrich with Blog Comment details if commentId is present
      if (payload.commentId) {
        try {
          const comment = await this.blogsService.findCommentById(
            payload.commentId,
          );
          if (comment) {
            const commentObj =
              typeof comment.toObject === 'function'
                ? comment.toObject()
                : JSON.parse(JSON.stringify(comment));
            Object.assign(enrichedParams, commentObj);

            enrichedParams.commentContent = comment.content;
          }
        } catch (e) {
          this.logger.error(`Error resolving comment details: ${e.message}`);
        }
      }

      // Enrich with Contact details if contactId is present
      if (payload.contactId) {
        try {
          const contact = await this.contactsService.findOne(payload.contactId);
          if (contact) {
            const contactObj =
              typeof contact.toObject === 'function'
                ? contact.toObject()
                : JSON.parse(JSON.stringify(contact));
            Object.assign(enrichedParams, contactObj);

            enrichedParams.contactName = contact.fullName;
            enrichedParams.contactEmail = contact.email;
            enrichedParams.contactPhone = contact.phone;
            enrichedParams.contactService = contact.service;
            enrichedParams.contactMessage = contact.message;
            enrichedParams.contactReplyMessage = contact.replyMessage || '';
            enrichedParams.contactRepliedAt = contact.repliedAt
              ? new Date(contact.repliedAt).toLocaleDateString()
              : '';

            if (contact.repliedBy) {
              try {
                const replier = await this.systemUsersService.findOne(
                  contact.repliedBy.toString(),
                );
                if (replier) {
                  enrichedParams.contactRepliedByName = replier.fullName;
                  enrichedParams.contactRepliedByEmail = replier.email;
                }
              } catch {}
            }

            if (contact.websiteId) {
              try {
                const site = await this.websitesService.findOne(
                  contact.websiteId.toString(),
                );
                if (site) {
                  enrichedParams.websiteName = site.name;
                  enrichedParams.websiteDomain = site.domain;
                  enrichedParams.websiteLogo = site.logo || '';
                  enrichedParams.websiteOgImage = site.seo?.ogImage || '';
                }
              } catch {}
            }
          }
        } catch (e) {
          this.logger.error(`Error resolving contact details: ${e.message}`);
        }
      }

      // Enrich with Nomination details if nominationId is present
      let nominationDoc: any = null;
      if (payload.nominationId) {
        try {
          const nomination = await this.nominationsService.findOne(
            payload.nominationId,
          );
          if (nomination) {
            const nominationObj =
              typeof nomination.toObject === 'function'
                ? nomination.toObject()
                : JSON.parse(JSON.stringify(nomination));
            nominationDoc = nominationObj;
            Object.assign(enrichedParams, nominationObj);

            if (nomination.nominatorId) {
              const nominator = nomination.nominatorId as any;
              enrichedParams.nominatorName = nominator.name;
              enrichedParams.nominatorEmail = nominator.email;
              enrichedParams.nominatorPhone = nominator.phoneNumber || '';
              enrichedParams.nominatorOrg = nominator.organization || '';
              enrichedParams.nominatorCity = nominator.city || '';
              if (!enrichedParams.email) {
                enrichedParams.email = nominator.email;
              }
            }

            if (nomination.nominees && nomination.nominees.length > 0) {
              enrichedParams.nomineeEmails = nomination.nominees
                .map((n: any) => n.nomineeId?.email)
                .filter(Boolean);

              enrichedParams.nomineeNames = nomination.nominees
                .map((n: any) => n.nomineeId?.name)
                .filter(Boolean);

              enrichedParams.nomineeDetails = nomination.nominees
                .map((n: any) => {
                  const name = n.nomineeId?.name || '';
                  const category = n.categoryId?.name || '';
                  return name && category
                    ? `${name} (Category: ${category})`
                    : name || category;
                })
                .filter(Boolean)
                .join(', ');
            } else {
              enrichedParams.nomineeDetails = '';
            }

            enrichedParams.nominationStatus = nomination.status;

            if (nomination.websiteId) {
              const site = nomination.websiteId as any;
              enrichedParams.websiteName = site.name || '';
              enrichedParams.websiteDomain = site.domain || '';
              enrichedParams.websiteLogo = site.logo || '';
              if (site.seo?.ogImage) {
                enrichedParams.websiteOgImage = site.seo.ogImage;
              } else {
                try {
                  const fullSite = await this.websitesService.findOne(
                    site._id.toString(),
                  );
                  enrichedParams.websiteOgImage = fullSite?.seo?.ogImage || '';
                } catch {
                  enrichedParams.websiteOgImage = '';
                }
              }
            }
          }
        } catch (e) {
          this.logger.error(`Error resolving nomination details: ${e.message}`);
        }
      }

      // Enrich with Sponsor details if sponsorId is present
      if (payload.sponsorId) {
        try {
          const sponsor = await this.sponsorsService.findOne(payload.sponsorId);
          if (sponsor) {
            const sponsorObj =
              typeof sponsor.toObject === 'function'
                ? sponsor.toObject()
                : JSON.parse(JSON.stringify(sponsor));
            Object.assign(enrichedParams, sponsorObj);

            enrichedParams.sponsorName = sponsor.name;
            enrichedParams.sponsorCompany = sponsor.companyName || '';
            enrichedParams.sponsorEmail = sponsor.email || '';
            enrichedParams.sponsorPhone = sponsor.phone || '';
            enrichedParams.sponsorWebsite = sponsor.website || '';
            enrichedParams.sponsorType = sponsor.type || '';
            enrichedParams.sponsorTier = sponsor.tier || '';
            enrichedParams.sponsorDescription = sponsor.description || '';
          }
        } catch (e) {
          this.logger.error(`Error resolving sponsor details: ${e.message}`);
        }
      }

      // Enrich with Website details if websiteId is present
      if (payload.websiteId) {
        try {
          const website = await this.websitesService.findOne(payload.websiteId);
          if (website) {
            const websiteObj =
              typeof website.toObject === 'function'
                ? website.toObject()
                : JSON.parse(JSON.stringify(website));
            Object.assign(enrichedParams, websiteObj);

            enrichedParams.websiteName = website.name;
            enrichedParams.websiteSlug = website.slug;
            enrichedParams.websiteDomain = website.domain;
            enrichedParams.websiteDescription = website.description || '';
            enrichedParams.websiteLogo = website.logo || '';
            enrichedParams.websiteOgImage = website.seo?.ogImage || '';
          }
        } catch (e) {
          this.logger.error(`Error resolving website details: ${e.message}`);
        }
      }

      // Enrich with Report details if reportId is present
      if (payload.reportId) {
        try {
          const report = await this.reportsService.findOne(payload.reportId);
          if (report) {
            const reportObj =
              typeof report.toObject === 'function'
                ? report.toObject()
                : JSON.parse(JSON.stringify(report));
            Object.assign(enrichedParams, reportObj);

            enrichedParams.reportTitle = report.title;
            enrichedParams.reportSlug = report.slug;
            enrichedParams.reportDescription = report.description || '';
            enrichedParams.reportDownloadCount = report.downloadCount || 0;

            if (report.websiteId) {
              try {
                const site = await this.websitesService.findOne(
                  report.websiteId.toString(),
                );
                if (site) {
                  enrichedParams.websiteName = site.name;
                  enrichedParams.websiteDomain = site.domain;
                  enrichedParams.websiteLogo = site.logo || '';
                  enrichedParams.websiteOgImage = site.seo?.ogImage || '';
                }
              } catch {}
            }
          }
        } catch (e) {
          this.logger.error(`Error resolving report details: ${e.message}`);
        }
      }

      // Enrich with Subscriber details if subscriberId is present (from subscriber.subscribed event)
      if (payload.subscriberId) {
        try {
          // Add subscriber-specific variables
          enrichedParams.subscriberId = payload.subscriberId;
          enrichedParams.subscriberEmail = payload.email;
          enrichedParams.subscriptionSource = payload.source || 'website';
          
          // Format subscription date and time
          if (payload.subscribedAt) {
            const subscriptionDate = new Date(payload.subscribedAt);
            const optionsDate: Intl.DateTimeFormatOptions = {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            };
            const optionsTime: Intl.DateTimeFormatOptions = {
              timeZone: 'Asia/Kolkata',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            };
            const formatterDate = new Intl.DateTimeFormat('en-US', optionsDate);
            const formatterTime = new Intl.DateTimeFormat('en-US', optionsTime);
            
            enrichedParams.subscribedAtDate = formatterDate.format(subscriptionDate);
            enrichedParams.subscribedAtTime = formatterTime.format(subscriptionDate);
            enrichedParams.subscribedAt = payload.subscribedAt;
          }

          // Ensure website details are populated for subscriber context
          if (payload.websiteId) {
            try {
              const website = await this.websitesService.findOne(payload.websiteId);
              if (website) {
                enrichedParams.websiteName = website.name;
                enrichedParams.websiteSlug = website.slug;
                enrichedParams.websiteDomain = website.domain;
                enrichedParams.websiteDescription = website.description || '';
                enrichedParams.websiteLogo = website.logo || '';
                enrichedParams.websiteOgImage = website.seo?.ogImage || '';
              }
            } catch (e) {
              this.logger.error(`Error resolving website details for subscriber: ${e.message}`);
            }
          }
        } catch (e) {
          this.logger.error(`Error enriching subscriber details: ${e.message}`);
        }
      }

      // Helper function to set nested value inside an object (cloned context)
      const setNestedValue = (obj: any, path: string, val: any) => {
        if (!obj || !path) return;
        const parts = path.split('.');
        let current = obj;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part] || typeof current[part] !== 'object') {
            current[part] = {};
          }
          current = current[part];
        }
        current[parts[parts.length - 1]] = val;
      };

      // Resolve array fields of objects to their latest element (last item)
      const resolveLatestArrayRecords = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        for (const [key, val] of Object.entries(obj)) {
          if (Array.isArray(val)) {
            if (
              val.length > 0 &&
              typeof val[0] === 'object' &&
              val[0] !== null
            ) {
              // Resolve nested arrays first
              for (const item of val) {
                resolveLatestArrayRecords(item);
              }
              // Override with latest element
              obj[key] = val[val.length - 1];
            }
          } else if (val && typeof val === 'object') {
            resolveLatestArrayRecords(val);
          }
        }
      };

      const resolveRecipientList = (expression: string): string[] => {
        if (!expression) return [];
        const parts = expression.split(',');
        const results: string[] = [];
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;
          const cleanPath = trimmed.replace(/[{}]/g, '').trim();
          if (cleanPath.includes('@') || cleanPath === 'admin') {
            results.push(cleanPath);
          } else {
            const resolved = this.variableResolverService.resolvePath(
              enrichedParams,
              cleanPath,
            );
            if (resolved) {
              if (Array.isArray(resolved)) {
                results.push(...resolved.map((r) => String(r).trim()));
              } else {
                results.push(String(resolved).trim());
              }
            }
          }
        }
        return [...new Set(results)].filter(
          (email) => email.includes('@') || email === 'admin',
        );
      };

      // Collapse array fields of objects to their latest element (last item) for template parameters
      resolveLatestArrayRecords(enrichedParams);

      const getPersonalizedParams = (targetEmail: string): any => {
        if (!nominationDoc || !nominationDoc.nominees || nominationDoc.nominees.length === 0) {
          return enrichedParams;
        }
        const matchedNominee = nominationDoc.nominees.find(
          (n: any) => n.nomineeId?.email?.toLowerCase() === targetEmail.toLowerCase(),
        );
        if (!matchedNominee) {
          return enrichedParams;
        }

        const targetParams = JSON.parse(JSON.stringify(enrichedParams));
        const nomineeName = matchedNominee.nomineeId?.name || '';
        const nomineeEmail = matchedNominee.nomineeId?.email || '';
        const categoryName = matchedNominee.categoryId?.name || '';

        targetParams.nomineeName = nomineeName;
        targetParams.nomineeEmail = nomineeEmail;
        targetParams.nomineeNames = [nomineeName];
        targetParams.nomineeEmails = [nomineeEmail];
        targetParams.nomineeDetails = nomineeName && categoryName
          ? `${nomineeName} (Category: ${categoryName})`
          : nomineeName || categoryName;

        if (targetParams.params) {
          targetParams.params.nomineeName = nomineeName;
          targetParams.params.nomineeEmail = nomineeEmail;
          targetParams.params.nomineeNames = [nomineeName];
          targetParams.params.nomineeEmails = [nomineeEmail];
          targetParams.params.nomineeDetails = targetParams.nomineeDetails;
        }

        return targetParams;
      };

      // Loop through all mapped actions for this event
      for (const mapping of mappings) {
        // 1. Multi-Trigger Array Processing (New Flow)
        if (mapping.triggers && mapping.triggers.length > 0) {
          for (const trigger of mapping.triggers) {
            if (trigger.isActive === false) {
              continue;
            }
            const template = trigger.templateId as any;
            if (!template) {
              this.logger.warn(
                `Template not found for trigger in event mapping: ${eventName}`,
              );
              continue;
            }

            const targets = resolveRecipientList(trigger.to);

            if (targets.length === 0) {
              this.logger.warn(
                `Could not resolve any recipients for trigger channel ${trigger.channel} on event ${eventName}`,
              );
              continue;
            }

            const ccTargets = trigger.cc
              ? resolveRecipientList(trigger.cc).join(', ')
              : undefined;
            const bccTargets = trigger.bcc
              ? resolveRecipientList(trigger.bcc).join(', ')
              : undefined;

            for (const target of targets) {
              const targetParams = getPersonalizedParams(target);
              const interpolatedSubject = this.variableResolverService.interpolate(
                template.subject || '',
                targetParams,
              );

              const contentTemplate = template.htmlContent || template.textContent || '';
              const interpolatedContent = this.variableResolverService.interpolate(
                contentTemplate,
                targetParams,
              );

              this.logger.log(
                `Dispatching template "${template.slug}" [Channel: ${trigger.channel}] for event: ${eventName} to: ${target}`,
              );

              await this.communicationsService.dispatch(
                template.channel,
                target,
                interpolatedSubject,
                interpolatedContent,
                {
                  templateSlug: template.slug,
                  senderEmail: trigger.senderEmail || mapping.senderEmail || template.senderEmail,
                  senderName: trigger.senderName || mapping.senderName || template.senderName,
                  eventTrigger: true,
                  eventName,
                },
                ccTargets,
                bccTargets,
              );
            }
          }
          continue;
        }

        // 2. Legacy Fallback Flow (Old Single-Trigger Mappings)
        const template = mapping.templateId as any;
        if (!template) {
          this.logger.warn(
            `Template not found for event mapping: ${eventName}`,
          );
          continue;
        }

        let targets: string[] = [];
        if (mapping.to) {
          targets = resolveRecipientList(mapping.to);
        } else {
          let recipient = '';
          if (payload.email) {
            recipient = payload.email;
          } else if (payload.recipient) {
            recipient = payload.recipient;
          } else if (payload.authorEmail) {
            recipient = payload.authorEmail;
          } else if (
            payload.downloadedBy &&
            payload.downloadedBy.includes('@')
          ) {
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
              const user = await this.systemUsersService.findOne(
                payload.createdBy,
              );
              if (user) {
                recipient = user.email;
              }
            } catch {}
          }
          if (recipient) {
            targets = [recipient];
          }
        }

        if (targets.length === 0) {
          this.logger.warn(
            `Could not resolve any recipient emails for event ${eventName} with mapping ${mapping.id || mapping._id}. Payload: ${JSON.stringify(payload)}`,
          );
          continue;
        }

        const ccTargets = mapping.cc
          ? resolveRecipientList(mapping.cc).join(', ')
          : undefined;
        const bccTargets = mapping.bcc
          ? resolveRecipientList(mapping.bcc).join(', ')
          : undefined;

        for (const target of targets) {
          const targetParams = getPersonalizedParams(target);
          const interpolatedSubject = this.variableResolverService.interpolate(
            template.subject || '',
            targetParams,
          );

          const contentTemplate = template.htmlContent || template.textContent || '';
          const interpolatedContent = this.variableResolverService.interpolate(
            contentTemplate,
            targetParams,
          );

          this.logger.log(
            `Dispatching legacy template "${template.slug}" [Channel: ${template.channel}] for event: ${eventName} to: ${target}`,
          );

          await this.communicationsService.dispatch(
            template.channel,
            target,
            interpolatedSubject,
            interpolatedContent,
            {
              templateSlug: template.slug,
              senderEmail: mapping.senderEmail || template.senderEmail,
              senderName: mapping.senderName || template.senderName,
              legacyTrigger: true,
              eventName,
            },
            ccTargets,
            bccTargets,
          );
        }
      }
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

  @OnEvent(AppEvents.SUBSCRIBER_SUBSCRIBED)
  handleSubscriberSubscribed(event: SubscriberSubscribedEvent) {
    this.logger.log(
      `📬 New subscriber subscribed: ${event.email} (website: ${event.websiteId})`,
    );
    this.triggerMappedEvent(AppEvents.SUBSCRIBER_SUBSCRIBED, event);
  }

  @OnEvent(AppEvents.SUBSCRIBER_BULK_EMAIL_SENT)
  handleSubscriberBulkEmailSent(event: SubscriberBulkEmailSentEvent) {
    this.logger.log(
      `📤 Bulk email sent to ${event.recipientCount} subscribers with subject: ${event.subject}`,
    );
    this.triggerMappedEvent(AppEvents.SUBSCRIBER_BULK_EMAIL_SENT, event);
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

  @OnEvent(AppEvents.EVENT_REMINDER)
  handleEventReminder(event: EventReminderEvent) {
    this.logger.log(`⏰ Event reminder scheduled for attendee: ${event.attendeeId} (Event: ${event.eventId})`);
    
    // Instead of resolving standard mappings for EVENT_REMINDER via the generic triggerMappedEvent,
    // we want this event to trigger a specific template id explicitly passed.
    // The scheduling requires triggerMappedEvent to be able to handle this.
    // However, triggerMappedEvent relies on event mapping stored in db.
    // So we will just pass it to triggerMappedEvent with the event object. The mapping will be resolved if exists.
    this.triggerMappedEvent(AppEvents.EVENT_REMINDER, event);
  }
}

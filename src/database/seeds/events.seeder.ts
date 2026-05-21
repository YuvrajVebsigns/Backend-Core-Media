import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { EventManagementService } from '@modules/event-management/event-management.service';
import { WebsitesService } from '@modules/websites/websites.service';
import {
  EventStatus,
  EventType,
} from '@modules/event-management/schemas/event.schema';

@Injectable()
export class EventsSeeder implements OnApplicationBootstrap {
  constructor(
    private readonly eventService: EventManagementService,
    private readonly websitesService: WebsitesService,
  ) {}

  async onApplicationBootstrap() {
    setTimeout(async () => {
      await this.seed();
    }, 2000);
  }

  async seed() {
    const websitesResponse = await this.websitesService.findAll({});
    const websites = websitesResponse.data;
    if (websites.length === 0) return;

    const eventTemplates = [
      {
        title: 'Global CIO Summit 2026',
        type: EventType.OFFLINE,
        status: EventStatus.SCHEDULED,
        location: {
          address: 'Grand Hyatt, Mumbai',
          city: 'Mumbai',
          mapLink: 'https://maps.app.goo.gl/xyz',
          lat: 19.076,
          lng: 72.8777,
        },
      },
      {
        title: 'Digital Transformation Webinar',
        type: EventType.ONLINE,
        status: EventStatus.PUBLISHED,
        meetingLink: 'https://zoom.us/j/123456789',
      },
      {
        title: 'AI in Enterprise Expo',
        type: EventType.OFFLINE,
        status: EventStatus.ON_GOING,
        location: {
          address: 'Pragati Maidan, New Delhi',
          city: 'New Delhi',
          mapLink: 'https://maps.app.goo.gl/abc',
          lat: 28.6139,
          lng: 77.209,
        },
      },
      {
        title: 'Cloud Security Workshop',
        type: EventType.ONLINE,
        status: EventStatus.SCHEDULED,
        meetingLink: 'https://teams.microsoft.com/l/meetup-join/xyz',
      },
      {
        title: 'FinTech Innovation Day',
        type: EventType.OFFLINE,
        status: EventStatus.IN_REVIEW,
        location: {
          address: 'The Leela, Bangalore',
          city: 'Bangalore',
          mapLink: 'https://maps.app.goo.gl/def',
          lat: 12.9716,
          lng: 77.5946,
        },
      },
    ];

    for (let i = 0; i < 12; i++) {
      const template = eventTemplates[i % eventTemplates.length];
      const title = `${template.title} - Edition ${Math.floor(i / eventTemplates.length) + 1}`;
      const slug = title
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]/g, '');

      const existing = await this.eventService
        .findAll({ status: template.status })
        .then((events) => events.find((e) => e.slug === slug));

      if (!existing) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + i * 5);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 8);

        // Assign to 1-2 random websites
        const siteCount = Math.floor(Math.random() * 2) + 1;
        const eventWebsites: any[] = [];
        for (let j = 0; j < siteCount; j++) {
          const randomSite =
            websites[Math.floor(Math.random() * websites.length)];
          if (!eventWebsites.includes(randomSite.id)) {
            eventWebsites.push(randomSite.id);
          }
        }

        await this.eventService.create({
          title,
          slug,
          description: {
            blocks: [
              {
                type: 'paragraph',
                data: {
                  text: `Join us for ${title}. A premier event for industry leaders.`,
                },
              },
            ],
          },
          excerpt: `A brief summary of ${title}`,
          type: template.type,
          status: template.status,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          location: template.location,
          meetingLink: template.meetingLink,
          websites: eventWebsites,
          agenda: [
            {
              time: '09:00 AM',
              title: 'Registration & Breakfast',
              speaker: 'Core Team',
              description: 'Kickstart the day',
            },
            {
              time: '10:00 AM',
              title: 'Keynote Speech',
              speaker: 'Industry Expert',
              description: 'Trends for 2026',
            },
          ],
        });
        console.log(`✅ Event seeded: ${title}`);
      }
    }
  }
}

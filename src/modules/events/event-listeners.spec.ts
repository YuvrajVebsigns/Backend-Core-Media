import { Test, TestingModule } from '@nestjs/testing';
import { EventListeners } from './event-listeners';
import { CommunicationsService } from '../communications/communications.service';
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

describe('EventListeners', () => {
  let eventListeners: EventListeners;
  let mockCommunicationsService: any;
  let mockNominationsService: any;
  let mockAttendeesService: any;

  beforeEach(async () => {
    mockCommunicationsService = {
      findEventMappingsByEvent: jest.fn(),
      dispatch: jest.fn(),
    };

    mockNominationsService = {
      findOne: jest.fn(),
    };

    mockAttendeesService = {
      findOneRegistree: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventListeners,
        VariableResolverService,
        { provide: CommunicationsService, useValue: mockCommunicationsService },
        { provide: SystemUsersService, useValue: {} },
        { provide: AttendeesService, useValue: mockAttendeesService },
        { provide: EventsService, useValue: {} },
        { provide: BlogsService, useValue: {} },
        { provide: ContactsService, useValue: {} },
        { provide: NominationsService, useValue: mockNominationsService },
        { provide: WebsitesService, useValue: {} },
        { provide: ReportsService, useValue: {} },
        { provide: SponsorsService, useValue: {} },
      ],
    }).compile();

    eventListeners = module.get<EventListeners>(EventListeners);
  });

  it('should resolve and dispatch emails correctly with dynamic expressions for nomination', async () => {
    // 1. Setup mock mappings
    const mockMapping = {
      to: '{{ nominatorEmail }}, {{ nomineeEmails }}',
      cc: '{{ nominatorEmail }}, admin@backup.com',
      bcc: 'bcc@security.com',
      templateId: { slug: 'nomination-received' },
      senderEmail: 'sender@coremedia.com',
      senderName: 'Core Media Admin',
    };
    mockCommunicationsService.findEventMappingsByEvent.mockResolvedValue([
      mockMapping,
    ]);

    // 2. Setup mock nomination
    const mockNomination = {
      nominatorId: {
        name: 'John Doe',
        email: 'nominator@gmail.com',
        phoneNumber: '1234567890',
        organization: 'Nominator Org',
        city: 'CityA',
      },
      nominees: [
        {
          nomineeId: {
            name: 'Nominee A',
            email: 'nominee.a@gmail.com',
          },
          categoryId: { name: 'Category 1' },
        },
        {
          nomineeId: {
            name: 'Nominee B',
            email: 'nominee.b@gmail.com',
          },
          categoryId: { name: 'Category 2' },
        },
      ],
      status: 'pending',
      websiteId: {
        name: 'Test Website',
        domain: 'test.com',
        logo: 'logo.png',
      },
    };
    mockNominationsService.findOne.mockResolvedValue(mockNomination);

    // 3. Trigger simulated mapped event
    const eventPayload = {
      nominationId: 'mock-nomination-id',
    };

    // Access the private method triggerMappedEvent
    await (eventListeners as any).triggerMappedEvent(
      'nomination.submitted',
      eventPayload,
    );

    // 4. Assert findOne was called
    expect(mockNominationsService.findOne).toHaveBeenCalledWith(
      'mock-nomination-id',
    );

    // 5. Assert dispatch was called for all recipients
    expect(
      mockCommunicationsService.dispatch,
    ).toHaveBeenCalledTimes(3);

    // Expected recipients resolved from '{{ nominatorEmail }}, {{ nomineeEmails }}'
    const expectedRecipients = [
      'nominator@gmail.com',
      'nominee.a@gmail.com',
      'nominee.b@gmail.com',
    ];

    expectedRecipients.forEach((recipient, idx) => {
      expect(
        mockCommunicationsService.dispatch,
      ).toHaveBeenNthCalledWith(
        idx + 1,
        undefined, // channel
        recipient,
        '', // subject
        '', // content
        expect.objectContaining({
          templateSlug: 'nomination-received',
          senderEmail: 'sender@coremedia.com',
          senderName: 'Core Media Admin',
          legacyTrigger: true,
          eventName: 'nomination.submitted',
        }),
        'nominator@gmail.com, admin@backup.com',
        'bcc@security.com',
      );
    });
  });

  it('should fall back to default recipient resolution logic if mapping.to is empty', async () => {
    const mockMapping = {
      templateId: { slug: 'fallback-template' },
      senderEmail: 'sender@coremedia.com',
      senderName: 'Core Media Admin',
    };
    mockCommunicationsService.findEventMappingsByEvent.mockResolvedValue([
      mockMapping,
    ]);

    const eventPayload = {
      email: 'direct@recipient.com',
    };

    await (eventListeners as any).triggerMappedEvent(
      'test.event',
      eventPayload,
    );

    expect(
      mockCommunicationsService.dispatch,
    ).toHaveBeenCalledTimes(1);
    expect(
      mockCommunicationsService.dispatch,
    ).toHaveBeenCalledWith(
      undefined,
      'direct@recipient.com',
      '',
      '',
      expect.objectContaining({
        templateSlug: 'fallback-template',
        senderEmail: 'sender@coremedia.com',
        senderName: 'Core Media Admin',
        legacyTrigger: true,
        eventName: 'test.event',
      }),
      undefined,
      undefined,
    );
  });

  it('should automatically resolve array of objects in enrichedParams to the latest record', async () => {
    const mockMapping = {
      to: '{{ registrations.email }}',
      templateId: { slug: 'registree-event-update' },
    };
    mockCommunicationsService.findEventMappingsByEvent.mockResolvedValue([
      mockMapping,
    ]);

    const mockRegistree = {
      name: 'Jane Doe',
      email: 'jane@gmail.com',
      registrations: [
        {
          email: 'old@gmail.com',
          eventId: {
            title: 'Old Event',
          },
        },
        {
          email: 'jane.latest@gmail.com',
          eventId: {
            title: 'Latest Event Title',
          },
        },
      ],
    };
    mockAttendeesService.findOneRegistree.mockResolvedValue(mockRegistree);

    const eventPayload = {
      registreeId: 'mock-registree-id',
    };

    await (eventListeners as any).triggerMappedEvent(
      'registree.registered',
      eventPayload,
    );

    expect(mockAttendeesService.findOneRegistree).toHaveBeenCalledWith(
      'mock-registree-id',
    );
    expect(
      mockCommunicationsService.dispatch,
    ).toHaveBeenCalledTimes(1);
    expect(
      mockCommunicationsService.dispatch,
    ).toHaveBeenCalledWith(
      undefined,
      'jane.latest@gmail.com',
      '',
      '',
      expect.objectContaining({
        templateSlug: 'registree-event-update',
        legacyTrigger: true,
        eventName: 'registree.registered',
      }),
      undefined,
      undefined,
    );
  });

  it('should personalize nominee-specific template variables for nominee recipients in nomination.submitted', async () => {
    // 1. Setup mock mappings with nominee variables in templates
    const mockMapping = {
      to: '{{ nominatorEmail }}, {{ nomineeEmails }}',
      templateId: {
        slug: 'nominee-notification',
        subject: 'Nomination for {{ nomineeName }}',
        htmlContent: '<p>Dear {{ nomineeName }}, you have been nominated for category {{ nomineeDetails }}. Nominator was {{ nominatorName }}.</p>',
      },
      senderEmail: 'sender@coremedia.com',
      senderName: 'Core Media Admin',
    };
    mockCommunicationsService.findEventMappingsByEvent.mockResolvedValue([
      mockMapping,
    ]);

    // 2. Setup mock nomination
    const mockNomination = {
      nominatorId: {
        name: 'John Doe',
        email: 'nominator@gmail.com',
      },
      nominees: [
        {
          nomineeId: {
            name: 'Nominee A',
            email: 'nominee.a@gmail.com',
          },
          categoryId: { name: 'Category 1' },
        },
        {
          nomineeId: {
            name: 'Nominee B',
            email: 'nominee.b@gmail.com',
          },
          categoryId: { name: 'Category 2' },
        },
      ],
      status: 'pending',
    };
    mockNominationsService.findOne.mockResolvedValue(mockNomination);

    // 3. Trigger simulated mapped event
    const eventPayload = {
      nominationId: 'mock-nomination-id',
      nomineeName: 'Nominee A, Nominee B', // This is what the event service passes normally
    };

    await (eventListeners as any).triggerMappedEvent(
      'nomination.submitted',
      eventPayload,
    );

    // 4. Assert dispatch was called 3 times (1 nominator, 2 nominees)
    expect(mockCommunicationsService.dispatch).toHaveBeenCalledTimes(3);

    // 1st call: Nominator
    expect(mockCommunicationsService.dispatch).toHaveBeenNthCalledWith(
      1,
      undefined,
      'nominator@gmail.com',
      'Nomination for Nominee A, Nominee B', // Nominator gets original merged nominee name
      '<p>Dear Nominee A, Nominee B, you have been nominated for category Nominee A (Category: Category 1), Nominee B (Category: Category 2). Nominator was John Doe.</p>',
      expect.any(Object),
      undefined,
      undefined,
    );

    // 2nd call: Nominee A (personalized)
    expect(mockCommunicationsService.dispatch).toHaveBeenNthCalledWith(
      2,
      undefined,
      'nominee.a@gmail.com',
      'Nomination for Nominee A', // Nominee A gets their own name
      '<p>Dear Nominee A, you have been nominated for category Nominee A (Category: Category 1). Nominator was John Doe.</p>',
      expect.any(Object),
      undefined,
      undefined,
    );

    // 3rd call: Nominee B (personalized)
    expect(mockCommunicationsService.dispatch).toHaveBeenNthCalledWith(
      3,
      undefined,
      'nominee.b@gmail.com',
      'Nomination for Nominee B', // Nominee B gets their own name
      '<p>Dear Nominee B, you have been nominated for category Nominee B (Category: Category 2). Nominator was John Doe.</p>',
      expect.any(Object),
      undefined,
      undefined,
    );
  });
});

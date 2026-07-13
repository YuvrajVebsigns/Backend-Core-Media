import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { CommunicationsService } from '../communications.service';
import { CommunicationLog } from '../schemas/communication-log.schema';
import { WebhookSubscription } from '../schemas/webhook-subscription.schema';
import { CommunicationProvider } from '../schemas/communication-provider.schema';
import { MessageTemplate } from '../schemas/message-template.schema';
import { EventTemplateMapping } from '../schemas/event-template-mapping.schema';
import { ProviderRegistryService } from '../providers/provider-registry.service';
import { VariableResolverService } from './variable-resolver.service';

describe('CommunicationsService Unit Tests', () => {
  let service: CommunicationsService;
  let mockLogModel: any;
  let mockTemplateModel: any;
  let mockQueue: any;

  beforeEach(async () => {
    // Mock the Queue
    mockQueue = {
      add: jest.fn().mockResolvedValue(null),
    };

    // Mock Log Model Instance & Constructor
    const mockLogInstance = (data: any) => {
      return {
        _id: 'log123',
        ...data,
        save: jest.fn().mockResolvedValue({
          _id: 'log123',
          ...data,
        }),
      };
    };
    mockLogModel = jest.fn().mockImplementation(mockLogInstance);

    // Mock Template Model
    mockTemplateModel = {
      findOne: jest.fn(),
    };

    // Mock Event Mapping Model
    const mockEventMappingModel = {
      db: {
        collection: jest.fn().mockReturnValue({
          dropIndex: jest.fn().mockResolvedValue(true),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationsService,
        VariableResolverService,
        {
          provide: getModelToken(CommunicationLog.name),
          useValue: mockLogModel,
        },
        {
          provide: getModelToken(WebhookSubscription.name),
          useValue: {},
        },
        {
          provide: getModelToken(CommunicationProvider.name),
          useValue: {},
        },
        {
          provide: getModelToken(MessageTemplate.name),
          useValue: mockTemplateModel,
        },
        {
          provide: getModelToken(EventTemplateMapping.name),
          useValue: mockEventMappingModel,
        },
        {
          provide: 'BullQueue_communications',
          useValue: mockQueue,
        },
        {
          provide: ProviderRegistryService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CommunicationsService>(CommunicationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dispatch', () => {
    it('should create and save a pending communication log and queue the job', async () => {
      const result = await service.dispatch(
        'email' as any,
        'test@recipient.com',
        'Hello World',
        'Body content',
        { custom: 'meta' },
        'cc@recipient.com',
        'bcc@recipient.com',
      );

      expect(result).toBeDefined();
      expect(mockLogModel).toHaveBeenCalledWith({
        channel: 'email',
        recipient: 'test@recipient.com',
        title: 'Hello World',
        content: 'Body content',
        status: 'pending',
        metadata: {
          custom: 'meta',
          cc: 'cc@recipient.com',
          bcc: 'bcc@recipient.com',
        },
      });
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        {
          logId: 'log123',
          channel: 'email',
          recipient: 'test@recipient.com',
          title: 'Hello World',
          content: 'Body content',
          cc: 'cc@recipient.com',
          bcc: 'bcc@recipient.com',
          metadata: {
            custom: 'meta',
            cc: 'cc@recipient.com',
            bcc: 'bcc@recipient.com',
          },
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
    });
  });

  describe('dispatchUnmappedTemplate', () => {
    const mockTemplate = {
      channel: 'email',
      slug: 'welcome-digest',
      subject: 'Welcome {{ user.name }}',
      htmlContent: '<p>Hello {{ user.name }}, your role is {{ user.role }}</p>',
      senderEmail: 'sender@coremedia.com',
      senderName: 'Core Media Team',
      get: jest.fn().mockImplementation((key) => {
        if (key === 'to') return 'user.email';
        return null;
      }),
    };

    it('should throw NotFoundException if template does not exist or is inactive', async () => {
      mockTemplateModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.dispatchUnmappedTemplate('invalid-slug', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should dispatch template correctly using targetOverride parameter', async () => {
      mockTemplateModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTemplate),
      });

      const payload = {
        user: {
          name: 'Vaibhav',
          role: 'Admin',
        },
      };

      const results = await service.dispatchUnmappedTemplate(
        'welcome-digest',
        payload,
        'override@recipient.com',
      );

      expect(results).toHaveLength(1);
      expect(mockLogModel).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: 'override@recipient.com',
          title: 'Welcome Vaibhav',
          content: '<p>Hello Vaibhav, your role is Admin</p>',
        }),
      );
    });

    it('should resolve targets using template target/to metadata path if targetOverride is not provided', async () => {
      mockTemplateModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTemplate),
      });

      const payload = {
        user: {
          name: 'Yuvraj',
          role: 'Editor',
          email: 'yuvraj@vebsigns.com',
        },
      };

      const results = await service.dispatchUnmappedTemplate(
        'welcome-digest',
        payload,
      );

      expect(results).toHaveLength(1);
      expect(mockLogModel).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: 'yuvraj@vebsigns.com',
          title: 'Welcome Yuvraj',
          content: '<p>Hello Yuvraj, your role is Editor</p>',
        }),
      );
    });

    it('should handle multi-recipient fan-out when target resolves to an array', async () => {
      const multiRecipientTemplate = {
        ...mockTemplate,
        get: jest.fn().mockImplementation((key) => {
          if (key === 'to') return 'users.email';
          return null;
        }),
      };

      mockTemplateModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(multiRecipientTemplate),
      });

      const payload = {
        users: [
          { email: 'user1@test.com', name: 'User 1' },
          { email: 'user2@test.com', name: 'User 2' },
        ],
      };

      const results = await service.dispatchUnmappedTemplate(
        'welcome-digest',
        payload,
      );

      expect(results).toHaveLength(2);
      expect(mockLogModel).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ recipient: 'user1@test.com' }),
      );
      expect(mockLogModel).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ recipient: 'user2@test.com' }),
      );
    });

    it('should warn and return empty array if recipients cannot be resolved', async () => {
      const emptyTemplate = {
        ...mockTemplate,
        get: jest.fn().mockReturnValue(null),
      };

      mockTemplateModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(emptyTemplate),
      });

      const results = await service.dispatchUnmappedTemplate(
        'welcome-digest',
        {},
      );

      expect(results).toEqual([]);
    });
  });
});

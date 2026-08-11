import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SubscribesService } from './subscribes.service';
import { Subscribe } from './schemas/subscribe.schema';
import { CommunicationsService } from '@modules/communications/communications.service';
import { AppEvents } from '@modules/events/event-definitions';

describe('SubscribesService', () => {
  let service: SubscribesService;
  let mockSubscribeModel: any;
  let mockCommunicationsService: any;
  let mockEventEmitter: any;

  beforeEach(async () => {
    mockCommunicationsService = {
      sendEmail: jest.fn().mockResolvedValue({ _id: 'log-1' }),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    mockSubscribeModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { _id: '507f1f77bcf86cd799439011', email: 'a@example.com' },
          { _id: '507f1f77bcf86cd799439012', email: 'b@example.com' },
          { _id: '507f1f77bcf86cd799439013', email: 'a@example.com' },
        ]),
      }),
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscribesService,
        {
          provide: getModelToken(Subscribe.name),
          useValue: mockSubscribeModel,
        },
        {
          provide: CommunicationsService,
          useValue: mockCommunicationsService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<SubscribesService>(SubscribesService);
  });

  it('should emit subscriber subscription event when a new website subscription is created', async () => {
    const save = jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439099',
      email: 'new@example.com',
      source: 'footer',
      websiteId: '507f1f77bcf86cd799439100',
      subscribedAt: new Date(),
    });

    const constructorMock = jest.fn().mockImplementation(function (this: any) {
      this.email = 'new@example.com';
      this.source = 'footer';
      this.websiteId = '507f1f77bcf86cd799439100';
      this.subscribedAt = new Date();
      this.save = save;
    });

    (service as any).subscribeModel = Object.assign(constructorMock, {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    });

    const result = await service.create(
      { email: 'new@example.com', source: 'footer' },
      '507f1f77bcf86cd799439100',
    );

    expect(result.email).toBe('new@example.com');
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      AppEvents.SUBSCRIBER_SUBSCRIBED,
      expect.objectContaining({ email: 'new@example.com' }),
    );
  });

  it('should send emails only to selected unique subscriber emails', async () => {
    const result = await service.sendSelectedEmails({
      subscriberIds: [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
      ],
      subject: 'Test subject',
      content: '<p>Hello</p>',
    });

    expect(result.totalRequested).toBe(3);
    expect(result.totalSent).toBe(2);
    expect(mockCommunicationsService.sendEmail).toHaveBeenCalledTimes(2);
    expect(mockCommunicationsService.sendEmail).toHaveBeenCalledWith(
      'a@example.com',
      'Test subject',
      '<p>Hello</p>',
      expect.objectContaining({
        source: 'selected-subscribers',
      }),
    );
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      AppEvents.SUBSCRIBER_BULK_EMAIL_SENT,
      expect.objectContaining({ recipientCount: 2 }),
    );
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SubscribesService } from './subscribes.service';
import { Subscribe } from './schemas/subscribe.schema';
import { CommunicationsService } from '@modules/communications/communications.service';

describe('SubscribesService', () => {
  let service: SubscribesService;
  let mockSubscribeModel: any;
  let mockCommunicationsService: any;

  beforeEach(async () => {
    mockCommunicationsService = {
      sendEmail: jest.fn().mockResolvedValue({ _id: 'log-1' }),
    };

    mockSubscribeModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { _id: '507f1f77bcf86cd799439011', email: 'a@example.com' },
          { _id: '507f1f77bcf86cd799439012', email: 'b@example.com' },
          { _id: '507f1f77bcf86cd799439013', email: 'a@example.com' },
        ]),
      }),
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
      ],
    }).compile();

    service = module.get<SubscribesService>(SubscribesService);
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
  });
});

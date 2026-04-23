import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { getQueueToken } from '@nestjs/bull';

describe('JobsService Unit Tests', () => {
  let service: JobsService;

  // Mock the Bull Queue
  const mockQueue = {
    add: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getQueueToken('emails'),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken('notifications'),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken('image-processing'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);

    // Clear mocks between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWelcomeEmail', () => {
    it('should push a send-welcome job to the emails queue', async () => {
      const testEmail = 'user@example.com';
      const testName = 'John Doe';

      await service.sendWelcomeEmail(testEmail, testName);

      expect(mockQueue.add).toHaveBeenCalledTimes(1);
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-welcome',
        { email: testEmail, name: testName },
        { attempts: 3, backoff: 5000 },
      );
    });
  });
});

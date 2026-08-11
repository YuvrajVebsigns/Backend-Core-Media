import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CommunicationsProcessor } from './communications.processor';
import { ProviderRegistryService } from '../providers/provider-registry.service';
import { CommunicationStatus } from '../schemas/communication-log.schema';

describe('CommunicationsProcessor', () => {
  let processor: CommunicationsProcessor;
  let mockLogModel: any;
  let mockProviderRegistry: any;

  beforeEach(async () => {
    mockLogModel = {
      findById: jest.fn(),
    };

    mockProviderRegistry = {
      resolveActiveProvider: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationsProcessor,
        {
          provide: getModelToken('CommunicationLog'),
          useValue: mockLogModel,
        },
        {
          provide: ProviderRegistryService,
          useValue: mockProviderRegistry,
        },
      ],
    }).compile();

    processor = module.get<CommunicationsProcessor>(CommunicationsProcessor);
  });

  it('should fail the log when no active email provider is configured instead of marking it as sent', async () => {
    const logDoc = {
      _id: 'log-1',
      recipient: 'user@test.com',
      title: 'Test',
      content: 'Body',
      metadata: {},
      status: CommunicationStatus.PENDING,
      error: null,
      retryCount: 0,
      save: jest.fn().mockResolvedValue(true),
    };

    mockLogModel.findById.mockResolvedValue(logDoc);
    mockProviderRegistry.resolveActiveProvider.mockResolvedValue(null);

    await expect(
      processor.handleSendEmail({
        data: {
          logId: 'log-1',
          recipient: 'user@test.com',
          title: 'Test',
          content: 'Body',
        },
        attemptsMade: 0,
      } as any),
    ).rejects.toThrow('No active email provider configured');

    expect(logDoc.status).toBe(CommunicationStatus.FAILED);
    expect(logDoc.error).toContain('No active email provider configured');
  });
});

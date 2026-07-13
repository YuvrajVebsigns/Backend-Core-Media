import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from '@core/health/redis.health';
import { StorageHealthIndicator } from '@core/health/storage.health';

describe('AppController', () => {
  let appController: AppController;

  const mockMongooseHealthIndicator = {
    pingCheck: jest.fn(),
  };

  const mockRedisHealthIndicator = {
    isHealthy: jest.fn(),
  };

  const mockStorageHealthIndicator = {
    isHealthy: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: MongooseHealthIndicator,
          useValue: mockMongooseHealthIndicator,
        },
        {
          provide: RedisHealthIndicator,
          useValue: mockRedisHealthIndicator,
        },
        {
          provide: StorageHealthIndicator,
          useValue: mockStorageHealthIndicator,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return status message', () => {
      expect(appController.getHello()).toBe('Core Media API is running');
    });
  });
});

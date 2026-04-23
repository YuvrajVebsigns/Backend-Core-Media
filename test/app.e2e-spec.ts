import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Replicate main.ts environment
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();
  });

  it('GET /api/v1 - App root should be responsive', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect((res) => {
        // Assert interceptor response wrapping
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
      });
  });

  it('GET /api/v1/health - System health check', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        // Since we wrap all responses globally with interceptor:
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('ok');
        expect(res.body.data.info.memory_heap).toBeDefined();
      });
  });

  afterAll(async () => {
    await app.close();
  });
});

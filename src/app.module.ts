import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard, seconds } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '@core/auth/auth.module';
import { SystemUsersModule } from '@core/system-users/system-users.module';
import { RolesModule } from '@core/roles/roles.module';
import { SeedModule } from '@database/seed.module';
import { HealthModule } from '@core/health/health.module';
import { JobsModule } from '@core/jobs/jobs.module';
import { EventsModule } from '@modules/events/events.module';
import { FeatureFlagModule } from '@core/feature-flags/feature-flag.module';
import { DatabaseModule } from '@database/database.module';
import { EventManagementModule } from '@modules/event-management/event-management.module';
import { AttendeesModule } from '@modules/attendees/attendees.module';
import { SidebarMenuModule } from '@core/sidebar-menu/sidebar-menu.module';
import { WebsitesModule } from '@modules/websites/websites.module';
import { BlogsModule } from '@modules/blogs/blogs.module';
import { FilesModule } from '@core/files/files.module';
import { SponsorsModule } from '@modules/sponsors/sponsors.module';
import { ContactsModule } from '@modules/contacts/contacts.module';
import { SubscribesModule } from '@modules/subscribes/subscribes.module';
import { NominationsModule } from '@modules/nominations/nominations.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { ClsModule } from 'nestjs-cls';
import { WebhookModule } from './webhook/webhook.module';
import { CommunicationsModule } from '@modules/communications/communications.module';
import { DeploymentsModule } from '@modules/deployments/deployments.module';
import { AnalyticsModule } from '@modules/analytics/analytics.module';
import { randomUUID } from 'crypto';
import { RoleCacheInterceptor } from '@common/interceptors/role-cache.interceptor';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';

const nodeEnv = process.env.NODE_ENV || 'development';
const envFilePath = fs.existsSync(`.env.${nodeEnv}`)
  ? `.env.${nodeEnv}`
  : fs.existsSync('.env.local')
    ? '.env.local'
    : '.env';

const envConfig = fs.existsSync(envFilePath)
  ? dotenv.parse(fs.readFileSync(envFilePath))
  : {};
const isProd = (process.env.NODE_ENV || envConfig.NODE_ENV) === 'production';
const useRedis =
  process.env.USE_REDIS === 'true' || envConfig.USE_REDIS === 'true' || isProd;

const redisQueueImports =
  isProd || useRedis
    ? [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => {
            const password = configService.get<string>('REDIS_PASSWORD');
            return {
              redis: {
                host: configService.get<string>('REDIS_HOST') || 'localhost',
                port: parseInt(
                  configService.get<string>('REDIS_PORT') || '6379',
                  10,
                ),
                ...(password ? { password } : {}),
                maxRetriesPerRequest: null,
              },
            };
          },
        }),
        JobsModule,
      ]
    : [];

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath,
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        JWT_SECRET: Joi.string().required(),
        MONGODB_URI: Joi.string().uri().required(),
        USE_REDIS: Joi.boolean().default(false),
        REDIS_HOST: Joi.string().optional(),
        REDIS_PORT: Joi.number().optional(),
        REDIS_PASSWORD: Joi.string().optional().allow(''),
        STORAGE_PROVIDER: Joi.string().optional().default('local'),
        STORAGE_ENV: Joi.string().optional(),
        S3_ENDPOINT: Joi.string().optional(),
        S3_ACCESS_KEY_ID: Joi.string().optional(),
        S3_SECRET_ACCESS_KEY: Joi.string().optional(),
        S3_BUCKET: Joi.string().optional(),
        S3_REGION: Joi.string().optional(),
        S3_FORCE_PATH_STYLE: Joi.boolean().optional(),
        CDN_URL: Joi.string().optional(),
      }),
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: any) =>
          req.headers['x-correlation-id'] || randomUUID(),
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: seconds(1),
          limit: 10,
        },
        {
          name: 'medium',
          ttl: seconds(60),
          limit: 100,
        },
        {
          name: 'long',
          ttl: seconds(3600),
          limit: 5000,
        },
      ],
      // Enable rate-limit response headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
      setHeaders: true,
      // Custom 429 error message
      errorMessage:
        'Rate limit exceeded. Please slow down and try again later.',
      // Use Redis storage in production/when Redis is enabled for distributed rate limiting
      ...(useRedis
        ? {
            storage: new ThrottlerStorageRedisService(
              (() => {
                const host =
                  envConfig.REDIS_HOST || process.env.REDIS_HOST || 'localhost';
                const port =
                  envConfig.REDIS_PORT || process.env.REDIS_PORT || '6379';
                const pass =
                  envConfig.REDIS_PASSWORD || process.env.REDIS_PASSWORD;
                return pass
                  ? `redis://:${encodeURIComponent(pass)}@${host}:${port}`
                  : `redis://${host}:${port}`;
              })(),
            ),
          }
        : {}),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isProd = configService.get<string>('NODE_ENV') === 'production';
        const useRedisEnv = configService.get('USE_REDIS');
        const useRedis =
          useRedisEnv === true || useRedisEnv === 'true' || isProd;

        if (useRedis) {
          try {
            const password = configService.get<string>('REDIS_PASSWORD');
            const store = await redisStore({
              socket: {
                host: configService.get<string>('REDIS_HOST') || 'localhost',
                port: parseInt(
                  configService.get<string>('REDIS_PORT') || '6379',
                  10,
                ),
              },
              ...(password ? { password } : {}),
              ttl: 60 * 1000,
            });
            return { store };
          } catch (error) {
            console.error('Failed to initialize Redis store:', error.message);
            // Fallback will happen below if we don't return here
          }
        }

        // Fallback to in-memory cache for local development
        return {
          ttl: 60 * 1000,
        };
      },
    }),
    DatabaseModule,
    AuthModule,
    SystemUsersModule,
    RolesModule,
    SeedModule,
    HealthModule,
    EventsModule,
    EventManagementModule,
    AttendeesModule,
    FeatureFlagModule,
    SidebarMenuModule,
    WebsitesModule,
    BlogsModule,
    FilesModule,
    SponsorsModule,
    SubscribesModule,
    ContactsModule,
    NominationsModule,
    ReportsModule,
    WebhookModule,
    CommunicationsModule,
    DeploymentsModule,
    AnalyticsModule,
    ...redisQueueImports,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RoleCacheInterceptor,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SystemUsersModule } from './system-users/system-users.module';
import { RolesModule } from './roles/roles.module';
import { SeedModule } from './database/seed.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { EventsModule } from './events/events.module';
import { FeatureFlagModule } from './feature-flags/feature-flag.module';
import { DatabaseModule } from './database/database.module';
import { EventManagementModule } from './modules/events/event-management.module';
import { AttendeesModule } from './modules/attendees/attendees.module';
import { SidebarMenuModule } from './modules/sidebar-menu/sidebar-menu.module';
import { WebsitesModule } from './modules/websites/websites.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { FilesModule } from './modules/files/files.module';
import { SponsorsModule } from './modules/sponsors/sponsors.module';
import { ClsModule } from 'nestjs-cls';
import { WebhookModule } from './webhook/webhook.module';
import { randomUUID } from 'crypto';
import { RoleCacheInterceptor } from './common/interceptors/role-cache.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

const nodeEnv = process.env.NODE_ENV || 'development';
const envFilePath = fs.existsSync(`.env.${nodeEnv}`) 
  ? `.env.${nodeEnv}` 
  : fs.existsSync('.env.local') 
    ? '.env.local' 
    : '.env';

const envConfig = fs.existsSync(envFilePath) ? dotenv.parse(fs.readFileSync(envFilePath)) : {};
const isProd = (process.env.NODE_ENV || envConfig.NODE_ENV) === 'production';
const useRedis = process.env.USE_REDIS === 'true' || envConfig.USE_REDIS === 'true' || isProd;

const redisQueueImports = isProd || useRedis ? [
  BullModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      redis: {
        host: configService.get<string>('REDIS_HOST') || 'localhost',
        port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
        maxRetriesPerRequest: null,
      },
    }),
  }),
  JobsModule,
] : [];

@Module({
  imports: [
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
        idGenerator: (req: any) => req.headers['x-correlation-id'] || randomUUID(),
      },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isProd = configService.get<string>('NODE_ENV') === 'production';
        const useRedisEnv = configService.get('USE_REDIS');
        const useRedis = useRedisEnv === true || useRedisEnv === 'true' || isProd;

        if (useRedis) {
          try {
            const store = await redisStore({
              socket: {
                host: configService.get<string>('REDIS_HOST') || 'localhost',
                port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
              },
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
    WebhookModule,
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
export class AppModule { }

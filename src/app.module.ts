import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';

const envFilePath = `.env.${process.env.NODE_ENV || 'local'}`;
const envConfig = fs.existsSync(envFilePath) ? dotenv.parse(fs.readFileSync(envFilePath)) : {};
const isProd = (process.env.NODE_ENV || envConfig.NODE_ENV) === 'production';
const useRedis = (process.env.USE_REDIS || envConfig.USE_REDIS) === 'true';

const redisQueueImports = isProd || useRedis ? [
  BullModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      redis: {
        host: configService.get<string>('REDIS_HOST') || 'localhost',
        port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
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
        const useRedis = configService.get<string>('USE_REDIS') === 'true';

        if (isProd || useRedis) {
          return {
            store: await redisStore({
              socket: {
                host: configService.get<string>('REDIS_HOST') || 'localhost',
                port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
              },
              ttl: 60 * 1000,
            }),
          };
        }

        // Fallback to in-memory cache for local development
        return {
          ttl: 60 * 1000,
        };
      },
    }),
    AuthModule,
    HealthModule,
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
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule { }

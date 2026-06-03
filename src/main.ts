import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import morgan from 'morgan';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClsServiceManager } from 'nestjs-cls';

async function bootstrap() {
  const traceFormat = winston.format((info) => {
    const cls = ClsServiceManager.getClsService();
    if (cls && cls.isActive()) {
      const reqId = cls.getId();
      if (reqId) {
        info.reqId = reqId;
      }
    }
    return info;
  });

  const instance = winston.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          traceFormat(),
          winston.format.timestamp(),
          winston.format.ms(),
          nestWinstonModuleUtilities.format.nestLike('API', {
            colors: true,
            prettyPrint: true,
          }),
        ),
      }),
      new winston.transports.DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'error',
        format: winston.format.combine(
          traceFormat(),
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      new winston.transports.DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          traceFormat(),
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({
      instance,
    }),
    rawBody: true,
  });

  // Set Global Prefix (e.g., /api/v1/...)
  app.setGlobalPrefix('api');

  // Enable URI Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const configService = app.get(ConfigService);

  app.use(helmet());

  const allowedOrigins = [
    `http://localhost:${configService.get<number>('PORT')}`,
    `http://localhost:${configService.get<number>('PORT')}/`,
    `http://localhost:3000`,
    `http://localhost:3000/`,
    'https://admin.uatcoremedia.vebsigns.com',
    'https://admin.uatcoremedia.vebsigns.com/',
    'https://backend.uatcoremedia.vebsigns.com',
    'https://backend.uatcoremedia.vebsigns.com/',
    'https://website.uatcoremedia.vebsigns.com',
    'https://website.uatcoremedia.vebsigns.com/',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
        /\.vebsigns\.com$/.test(origin) ||
        /(^|\.)coremediagroup\.com$/.test(origin) ||
        /^https?:\/\//.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable Dependency Injection for custom class-validator decorators (e.g. database uniqueness checks)
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalFilters(new GlobalExceptionFilter());
  const reflector = app.get(Reflector);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  const port = configService.get<number>('PORT') || 3000;
  const serverUrl = `http://localhost:${port}`;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Core Media API')
    .setDescription('The Core Media API documentation (Version 1)')
    .setVersion('1.0')
    .addServer('https://backend.uatcoremedia.vebsigns.com', 'Test Server')
    .addServer(serverUrl, 'Local Development')
    .addBearerAuth()
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter Website JWT token',
      },
      'website-token',
    )
    .addTag('Admin | Auth', 'Authentication endpoints (login, signup, OTP, password reset)')
    .addTag('Admin | System Users', 'System user management')
    .addTag('Admin | Roles', 'Role and permission management')
    .addTag('Admin | SidebarMenus', 'Sidebar menu management')
    .addTag('Admin | Websites', 'Website configuration management')
    .addTag('Admin | Website Pages', 'Website page CMS management (admin)')
    .addTag('Admin | Website Navbar', 'Website navbar configuration management (admin)')
    .addTag('Admin | Blog', 'Blog management (admin)')
    .addTag('Admin | Events', 'Event CMS management (admin)')
    .addTag('Admin | Sponsors', 'Sponsor management (admin)')
    .addTag('Admin | Attendees', 'Event attendee management and check-in (admin)')
    .addTag('Admin | Registrees', 'Global unique CRM lead/contact tracking and history management (admin)')
    .addTag('Admin | Contacts', 'Contact form submission and response management')
    .addTag('Website | Websites', 'Public website endpoints')
    .addTag('Website | Pages', 'Public website page endpoints')
    .addTag('Website | Navbar', 'Public website navbar endpoints')
    .addTag('Website | SEO', 'Public website SEO endpoints')
    .addTag('Website | Blogs', 'Public website blog endpoints')
    .addTag('Website | Events', 'Public website events endpoints')
    .addTag('Website | Contacts', 'Public website contact form submission endpoints')
    .addTag('Website | Attendees', 'Public event attendee registration and pass verification')
    .addTag('Website | Sponsors', 'Public website sponsor endpoints')
    .addTag('Admin | Files', 'File upload and management')
    .addTag('Admin | System', 'System health and webhooks')
    .addTag('Admin | Background Jobs', 'Background job management')
    .addTag('Admin | Feature Flags', 'Feature flag management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Clean up empty/problematic schemas for better Apidog compatibility
  if (document.components?.schemas) {
    const schemas = document.components.schemas as Record<string, any>;

    // Replace all $ref to 'Object' schema with inline { type: 'object' }
    const replaceObjectRefs = (obj: any): void => {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        if (
          key === '$ref' &&
          obj[key] === '#/components/schemas/Object'
        ) {
          delete obj['$ref'];
          obj['type'] = 'object';
          return;
        }
        replaceObjectRefs(obj[key]);
      }
    };
    replaceObjectRefs(document);

    // Remove the empty 'Object' schema itself
    if (
      schemas['Object'] &&
      schemas['Object'].type === 'object' &&
      Object.keys(schemas['Object'].properties || {}).length === 0
    ) {
      delete schemas['Object'];
    }
  }

  // Serve Swagger UI at /api/docs
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const docsDir = join(__dirname, '..', 'docs');
  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true });
  }
  writeFileSync(
    join(docsDir, 'swagger-spec.json'),
    JSON.stringify(document, null, 2),
  );

  const nodeEnv = configService.get<string>('NODE_ENV');
  if (nodeEnv === 'development' || nodeEnv === 'test') {
    app.use(morgan('dev'));
    // Redirect root to swagger in development/test only
    app.getHttpAdapter().get('/', (req: any, res: any) => {
      res.redirect(301, '/api/docs#');
    });
  } else {
    app.use(
      morgan('combined', {
        stream: {
          write: (message) => instance.info(message.trim()),
        },
      }),
    );
  }

  await app.listen(port);

  const uri = configService.get<string>('MONGODB_URI');
  const useRedis = configService.get<boolean>('USE_REDIS') === true;
  const redisHost = configService.get<string>('REDIS_HOST') || 'localhost';
  const redisPort = configService.get<string>('REDIS_PORT') || '6379';
  const url = await app.getUrl();

  console.log('\n┌────────────────────────────────────────────────────────┐');
  console.log('│                🚀  Server is running!                  │');
  console.log('├────────────────────────────────────────────────────────┤');
  console.log(`│  ENV      : ${nodeEnv?.padEnd(40)}   │`);
  console.log(`│  PORT     : ${port.toString().padEnd(40)}   │`);
  console.log(`│  URL      : ${url.padEnd(40)}   │`);
  console.log(`│  SWAGGER  : ${(url + '/api/docs').padEnd(40)}   │`);
  console.log('├────────────────────────────────────────────────────────┤');
  console.log('│           🍃  MongoDB Connection Status                │');
  console.log('├────────────────────────────────────────────────────────┤');
  console.log(
    `│  URI      : ${uri?.replace(/:\/\/([^:]+):([^@]+)@/, '://<user>:<pass>@').padEnd(40)} │`,
  );

  if (useRedis) {
    console.log('├────────────────────────────────────────────────────────┤');
    console.log('│           🟢  Redis Connection Status                  │');
    console.log('├────────────────────────────────────────────────────────┤');
    console.log(`│  STATUS   : ${'Connected'.padEnd(40)}   │`);
    console.log(`│  HOST     : ${redisHost.padEnd(40)}   │`);
    console.log(`│  PORT     : ${redisPort.toString().padEnd(40)}   │`);
  } else {
    console.log('├────────────────────────────────────────────────────────┤');
    console.log('│           ⚪️  Redis Connection Status                  │');
    console.log('├────────────────────────────────────────────────────────┤');
    console.log(
      `│  STATUS   : ${'Disabled (In-Memory Fallback)'.padEnd(40)}   │`,
    );
  }
  console.log('└────────────────────────────────────────────────────────┘\n');
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});

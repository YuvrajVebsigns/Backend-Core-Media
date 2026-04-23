import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import morgan from 'morgan';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
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
        format: winston.format.combine(traceFormat(), winston.format.timestamp(), winston.format.json()),
      }),
      new winston.transports.DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(traceFormat(), winston.format.timestamp(), winston.format.json()),
      }),
    ],
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({
      instance,
    }),
  });

  // Set Global Prefix (e.g., /api/v1/...)
  app.setGlobalPrefix('api');

  // Enable URI Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.use(helmet());

  app.enableCors({
    origin: true,
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
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useStaticAssets(join(__dirname, '..', 'public'));

  const configService = app.get(ConfigService);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Core Media API')
    .setDescription('The Core Media API documentation (Version 1)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
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
  if (nodeEnv === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: {
        write: (message) => instance.info(message.trim()),
      }
    }));
  }

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});

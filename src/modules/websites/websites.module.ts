import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '@core/auth/auth.module';

// Existing
import { WebsitesService } from './websites.service';
import { WebsitesController } from './websites.controller';
import { WebsiteWebsitesController } from './website-websites.controller';
import { Website, WebsiteSchema } from './schemas/website.schema';

// New Schemas
import { WebsitePage, WebsitePageSchema } from './schemas/website-page.schema';
import { Navbar, NavbarSchema } from './schemas/navbar.schema';

// New Controllers
import { WebsitePageController } from './controllers/website-page.controller';
import { NavbarController } from './controllers/navbar.controller';
import { SeoController } from './controllers/seo.controller';

// New Services
import { WebsitePageService } from './services/website-page.service';
import { NavbarService } from './services/navbar.service';
import { SeoService } from './services/seo.service';
import { SlugService } from './services/slug.service';
import { WebsiteCacheService } from './services/website-cache.service';
import { SectionService } from './services/section.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Website.name, schema: WebsiteSchema },
      { name: WebsitePage.name, schema: WebsitePageSchema },
      { name: Navbar.name, schema: NavbarSchema },
    ]),
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_WEBSITE_EXPIRES_IN') ||
            '1d') as any,
        },
      }),
    }),
  ],
  controllers: [
    WebsitesController,
    WebsiteWebsitesController,
    WebsitePageController,
    NavbarController,
    SeoController,
  ],
  providers: [
    WebsitesService,
    WebsitePageService,
    NavbarService,
    SeoService,
    SlugService,
    WebsiteCacheService,
    SectionService,
  ],
  exports: [WebsitesService, WebsitePageService, NavbarService, MongooseModule],
})
export class WebsitesModule {}

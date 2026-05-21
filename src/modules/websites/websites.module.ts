import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebsitesService } from './websites.service';
import { WebsitesController } from './websites.controller';
import { WebsiteWebsitesController } from './website-websites.controller';
import { Website, WebsiteSchema } from './schemas/website.schema';
import { AuthModule } from '@core/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Website.name, schema: WebsiteSchema }]),
    AuthModule,
  ],
  controllers: [WebsitesController, WebsiteWebsitesController],
  providers: [WebsitesService],
  exports: [WebsitesService],
})
export class WebsitesModule {}

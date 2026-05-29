import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SponsorsService } from './sponsors.service';
import { SponsorsController } from './sponsors.controller';
import { WebsiteSponsorsController } from './website-sponsors.controller';
import { Sponsor, SponsorSchema } from './schemas/sponsor.schema';
import { FilesModule } from '@core/files/files.module';
import { AuthModule } from '@core/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Sponsor.name, schema: SponsorSchema }]),
    AuthModule,
    FilesModule,
  ],
  controllers: [SponsorsController, WebsiteSponsorsController],
  providers: [SponsorsService],
  exports: [SponsorsService],
})
export class SponsorsModule {}

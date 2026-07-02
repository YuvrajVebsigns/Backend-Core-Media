import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Nomination, NominationSchema } from './schemas/nomination.schema';
import {
  NominationCategory,
  NominationCategorySchema,
} from './schemas/nomination-category.schema';
import {
  Registree,
  RegistreeSchema,
} from '@modules/attendees/schemas/registree.schema';
import { NominationsService } from './nominations.service';
import { NominationCategoriesService } from './nomination-categories.service';
import { AdminNominationsController } from './nominations.controller';
import { AdminNominationCategoriesController } from './nomination-categories.controller';
import { WebsiteNominationsController } from './website-nominations.controller';
import { AuthModule } from '@core/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Nomination.name, schema: NominationSchema },
      { name: NominationCategory.name, schema: NominationCategorySchema },
      { name: Registree.name, schema: RegistreeSchema },
    ]),
    AuthModule,
  ],
  controllers: [
    AdminNominationsController,
    AdminNominationCategoriesController,
    WebsiteNominationsController,
  ],
  providers: [NominationsService, NominationCategoriesService],
  exports: [NominationsService, NominationCategoriesService],
})
export class NominationsModule {}

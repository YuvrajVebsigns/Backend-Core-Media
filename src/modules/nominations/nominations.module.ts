import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Nomination, NominationSchema } from './schemas/nomination.schema';
import {
  NominationCategory,
  NominationCategorySchema,
} from './schemas/nomination-category.schema';
import {
  NominationSubCategory,
  NominationSubCategorySchema,
} from './schemas/nomination-sub-category.schema';
import {
  Registree,
  RegistreeSchema,
} from '@modules/attendees/schemas/registree.schema';
import { NominationsService } from './nominations.service';
import { NominationCategoriesService } from './nomination-categories.service';
import { NominationSubCategoriesService } from './nomination-sub-categories.service';
import { AdminNominationsController } from './nominations.controller';
import { AdminNominationCategoriesController } from './nomination-categories.controller';
import { AdminNominationSubCategoriesController } from './nomination-sub-categories.controller';
import { WebsiteNominationsController } from './website-nominations.controller';
import { AuthModule } from '@core/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Nomination.name, schema: NominationSchema },
      { name: NominationCategory.name, schema: NominationCategorySchema },
      { name: NominationSubCategory.name, schema: NominationSubCategorySchema },
      { name: Registree.name, schema: RegistreeSchema },
    ]),
    AuthModule,
  ],
  controllers: [
    AdminNominationsController,
    AdminNominationCategoriesController,
    AdminNominationSubCategoriesController,
    WebsiteNominationsController,
  ],
  providers: [
    NominationsService,
    NominationCategoriesService,
    NominationSubCategoriesService,
  ],
  exports: [
    NominationsService,
    NominationCategoriesService,
    NominationSubCategoriesService,
  ],
})
export class NominationsModule {}

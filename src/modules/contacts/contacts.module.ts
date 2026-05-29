import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { WebsiteContactsController } from './website-contacts.controller';
import { Contact, ContactSchema } from './schemas/contact.schema';
import { AuthModule } from '@core/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Contact.name, schema: ContactSchema }]),
    AuthModule,
  ],
  controllers: [ContactsController, WebsiteContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}

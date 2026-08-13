import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { WebsiteContactsController } from './website-contacts.controller';
import { Contact, ContactSchema } from './schemas/contact.schema';
import { AuthModule } from '@core/auth/auth.module';
import { CaptchaService } from './services/captcha.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Contact.name, schema: ContactSchema }]),
    AuthModule,
  ],
  controllers: [ContactsController, WebsiteContactsController],
  providers: [ContactsService, CaptchaService],
  exports: [ContactsService],
})
export class ContactsModule {}

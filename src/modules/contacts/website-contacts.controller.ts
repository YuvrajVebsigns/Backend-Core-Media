import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/contact.dto';

@ApiTags('Website | Contacts')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteAuthGuard)
@Throttle({
  short: { ttl: 1000, limit: 2 }, // Strict burst protection
  medium: { ttl: 60000, limit: 5 }, // Limit form submissions to 5 per minute
  long: { ttl: 3600000, limit: 50 }, // Max 50 per hour from same IP
})
@Controller('website/contacts')
export class WebsiteContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit contact form inquiries from a website' })
  @ApiResponse({
    status: 201,
    description: 'Contact submission recorded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized website token' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async create(
    @CurrentWebsite() website: any,
    @Body() createDto: CreateContactDto,
  ) {
    return this.contactsService.create(createDto, website.id);
  }
}

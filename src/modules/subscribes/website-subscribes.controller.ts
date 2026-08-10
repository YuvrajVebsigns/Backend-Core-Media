import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { WebsiteAuthGuard } from '@core/auth/guards/website-auth.guard';
import { UseGuards } from '@nestjs/common';
import { CurrentWebsite } from '@common/decorators/current-website.decorator';
import { SubscribesService } from './subscribes.service';
import { CreateSubscribeDto } from './dto/subscribe.dto';

@ApiTags('Website | Subscribes')
@ApiBearerAuth('website-token')
@UseGuards(WebsiteAuthGuard)
@Throttle({ short: { ttl: 1000, limit: 3 }, medium: { ttl: 60000, limit: 10 }, long: { ttl: 3600000, limit: 100 } })
@Controller('website/subscribes')
export class WebsiteSubscribesController {
  constructor(private readonly subscribesService: SubscribesService) {}

  @Post()
  @ApiOperation({ summary: 'Submit email subscription from website' })
  @ApiResponse({ status: 201, description: 'Subscription recorded' })
  async create(@CurrentWebsite() website: any, @Body() createDto: CreateSubscribeDto) {
    return this.subscribesService.create(createDto, website.id);
  }
}

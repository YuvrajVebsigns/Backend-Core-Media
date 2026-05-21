import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SponsorsService } from './sponsors.service';
import { CreateSponsorDto, UpdateSponsorDto } from './dto/sponsor.dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';

@ApiTags('Sponsors')
@Controller('sponsors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sponsor' })
  create(@Body() createSponsorDto: CreateSponsorDto) {
    return this.sponsorsService.create(createSponsorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sponsors' })
  findAll() {
    return this.sponsorsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sponsor by id' })
  findOne(@Param('id') id: string) {
    return this.sponsorsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sponsor' })
  update(@Param('id') id: string, @Body() updateSponsorDto: UpdateSponsorDto) {
    return this.sponsorsService.update(id, updateSponsorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sponsor' })
  remove(@Param('id') id: string) {
    return this.sponsorsService.remove(id);
  }
}

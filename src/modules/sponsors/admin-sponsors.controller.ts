import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SponsorsService } from './sponsors.service';
import {
  CreateSponsorDto,
  UpdateSponsorDto,
  QuerySponsorDto,
} from './dto/sponsor.dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemUserRole } from '@common/enums/role.enum';

@ApiTags('Admin | Sponsors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/sponsors')
export class AdminSponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  @Post()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new sponsor' })
  create(@Body() createSponsorDto: CreateSponsorDto) {
    return this.sponsorsService.create(createSponsorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sponsors with pagination and filters' })
  @ApiQuery({
    name: 'showMetadata',
    required: false,
    type: Boolean,
    description: 'Whether to show creation and update timestamps',
  })
  findAll(@Query() queryDto: QuerySponsorDto) {
    return this.sponsorsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific sponsor by ID' })
  findOne(@Param('id') id: string) {
    return this.sponsorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Update a sponsor' })
  update(@Param('id') id: string, @Body() updateSponsorDto: UpdateSponsorDto) {
    return this.sponsorsService.update(id, updateSponsorDto);
  }

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a sponsor (soft delete)' })
  remove(@Param('id') id: string) {
    return this.sponsorsService.remove(id);
  }
}

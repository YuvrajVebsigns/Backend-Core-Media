import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebsitesService } from './websites.service';
import {
  CreateWebsiteDto,
  UpdateWebsiteDto,
  QueryWebsiteDto,
} from './dto/website.dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import { ApiStandardResponse } from '@common/decorators/api-standard-response.decorator';

@ApiTags('Admin | Websites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/websites')
export class WebsitesController {
  constructor(private readonly websitesService: WebsitesService) {}

  @Post()
  @Roles(SystemUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new website (Super Admin only)' })
  @ApiStandardResponse({ status: 201, description: 'Website created' })
  create(@Body() createWebsiteDto: CreateWebsiteDto) {
    return this.websitesService.create(createWebsiteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all websites' })
  @ApiStandardResponse({
    status: 200,
    description: 'List of websites',
    isPaginated: true,
  })
  findAll(@Query() query: QueryWebsiteDto) {
    return this.websitesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a website by ID' })
  @ApiStandardResponse({ status: 200, description: 'Website found' })
  findOne(@Param('id') id: string) {
    return this.websitesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a website' })
  @ApiStandardResponse({ status: 200, description: 'Website updated' })
  update(@Param('id') id: string, @Body() updateWebsiteDto: UpdateWebsiteDto) {
    return this.websitesService.update(id, updateWebsiteDto);
  }

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete a website (Super Admin only)' })
  @ApiStandardResponse({ status: 200, description: 'Website deleted' })
  remove(@Param('id') id: string) {
    return this.websitesService.remove(id);
  }
}

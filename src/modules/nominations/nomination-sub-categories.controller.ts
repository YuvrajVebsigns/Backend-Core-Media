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
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import { NominationSubCategoriesService } from './nomination-sub-categories.service';
import {
  CreateNominationCategoryDto,
  UpdateNominationCategoryDto,
  QueryNominationCategoryDto,
} from './dto/nomination-sub-category.dto';

@ApiTags('Admin | Nomination Sub Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Controller('admin/nomination-sub-categories')
export class AdminNominationSubCategoriesController {
  constructor(
    private readonly subCategoriesService: NominationSubCategoriesService,
  ) {}

  @Post()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('nominations.create')
  @ApiOperation({ summary: 'Create a new nomination sub category' })
  @ApiResponse({
    status: 201,
    description: 'Sub category created successfully',
  })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  create(@Body() createDto: CreateNominationCategoryDto) {
    return this.subCategoriesService.create(createDto);
  }

  @Get()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @Permission('nominations.view')
  @ApiOperation({
    summary: 'Get all nomination sub categories with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'List of nomination sub categories',
  })
  findAll(@Query() queryDto: QueryNominationCategoryDto) {
    return this.subCategoriesService.findAll(queryDto);
  }

  @Get(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @Permission('nominations.view')
  @ApiOperation({ summary: 'Get a nomination sub category by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the sub category' })
  @ApiResponse({ status: 200, description: 'Sub category details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.subCategoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('nominations.update')
  @ApiOperation({ summary: 'Update a nomination sub category' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the sub category' })
  @ApiResponse({
    status: 200,
    description: 'Sub category updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNominationCategoryDto,
  ) {
    return this.subCategoriesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN)
  @Permission('nominations.delete')
  @ApiOperation({ summary: 'Soft delete a nomination sub category' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the sub category' })
  @ApiResponse({
    status: 200,
    description: 'Sub category deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string) {
    return this.subCategoriesService.remove(id);
  }
}

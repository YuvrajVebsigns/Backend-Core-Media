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
import { NominationCategoriesService } from './nomination-categories.service';
import {
  CreateNominationCategoryDto,
  UpdateNominationCategoryDto,
  QueryNominationCategoryDto,
} from './dto/nomination-category.dto';

@ApiTags('Admin | Nomination Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Controller('admin/nomination-categories')
export class AdminNominationCategoriesController {
  constructor(
    private readonly categoriesService: NominationCategoriesService,
  ) {}

  @Post()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('nominations.create')
  @ApiOperation({ summary: 'Create a new nomination category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  create(@Body() createDto: CreateNominationCategoryDto) {
    return this.categoriesService.create(createDto);
  }

  @Get()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @Permission('nominations.view')
  @ApiOperation({ summary: 'Get all nomination categories with pagination' })
  @ApiResponse({ status: 200, description: 'List of nomination categories' })
  findAll(@Query() queryDto: QueryNominationCategoryDto) {
    return this.categoriesService.findAll(queryDto);
  }

  @Get(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @Permission('nominations.view')
  @ApiOperation({ summary: 'Get a nomination category by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the category' })
  @ApiResponse({ status: 200, description: 'Category details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @Permission('nominations.update')
  @ApiOperation({ summary: 'Update a nomination category' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNominationCategoryDto,
  ) {
    return this.categoriesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(SystemUserRole.SUPER_ADMIN)
  @Permission('nominations.delete')
  @ApiOperation({ summary: 'Soft delete a nomination category' })
  @ApiParam({ name: 'id', description: 'MongoDB ID of the category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}

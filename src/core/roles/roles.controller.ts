import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiStandardResponse } from '@common/decorators/api-standard-response.decorator';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from './dto/role.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Admin | Roles')
@ApiBearerAuth()
@Controller('admin/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dynamic role' })
  @ApiStandardResponse({
    status: 201,
    description: 'Role created',
    type: RoleResponseDto,
  })
  create(@Body() createDto: CreateRoleDto, @CurrentUser() user: any) {
    return this.rolesService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all dynamic roles' })
  @ApiStandardResponse({
    status: 200,
    description: 'List of roles',
    type: RoleResponseDto,
    isArray: true,
  })
  findAll(@CurrentUser() user: any) {
    return this.rolesService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiStandardResponse({
    status: 200,
    description: 'Role found',
    type: RoleResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiStandardResponse({
    status: 200,
    description: 'Role updated',
    type: RoleResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRoleDto,
    @CurrentUser() user: any,
  ) {
    return this.rolesService.update(id, updateDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a role' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rolesService.remove(id, user);
  }
}

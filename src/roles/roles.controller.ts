import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from './dto/role.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dynamic role' })
  @ApiResponse({ status: 201, description: 'Role created', type: RoleResponseDto })
  create(@Body() createDto: CreateRoleDto) {
    return this.rolesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all dynamic roles' })
  @ApiResponse({ status: 200, description: 'List of roles', type: [RoleResponseDto] })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiResponse({ status: 200, description: 'Role found', type: RoleResponseDto })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: 200, description: 'Role updated', type: RoleResponseDto })
  update(@Param('id') id: string, @Body() updateDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a role' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}

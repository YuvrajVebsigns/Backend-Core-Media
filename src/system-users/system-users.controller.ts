import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiStandardResponse } from '../common/decorators/api-standard-response.decorator';
import { SystemUsersService } from './system-users.service';
import { CreateSystemUserDto, UpdateSystemUserDto, SystemUserResponseDto, QuerySystemUserDto } from './dto/system-user.dto';
import { Query } from '@nestjs/common';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin | System Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/system-users')
export class SystemUsersController {
  constructor(private readonly systemUsersService: SystemUsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new system user' })
  @ApiStandardResponse({ status: 201, description: 'User created', type: SystemUserResponseDto })
  create(@Body() createDto: CreateSystemUserDto) {
    return this.systemUsersService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all system users with pagination, search and filters' })
  @ApiStandardResponse({ 
    status: 200, 
    description: 'List of users with pagination', 
    type: SystemUserResponseDto, 
    isPaginated: true 
  })
  findAll(@Query() query: QuerySystemUserDto, @CurrentUser() user: any) {
    return this.systemUsersService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a system user by ID' })
  @ApiStandardResponse({ status: 200, description: 'User found', type: SystemUserResponseDto })
  findOne(@Param('id') id: string) {
    return this.systemUsersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a system user' })
  @ApiStandardResponse({ status: 200, description: 'User updated', type: SystemUserResponseDto })
  update(@Param('id') id: string, @Body() updateDto: UpdateSystemUserDto) {
    return this.systemUsersService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a system user' })
  remove(@Param('id') id: string) {
    return this.systemUsersService.remove(id);
  }
}

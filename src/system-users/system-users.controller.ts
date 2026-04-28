import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SystemUsersService } from './system-users.service';
import { CreateSystemUserDto, UpdateSystemUserDto, SystemUserResponseDto } from './dto/system-user.dto';

@ApiTags('System Users')
@ApiBearerAuth()
@Controller('system-users')
export class SystemUsersController {
  constructor(private readonly systemUsersService: SystemUsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new system user' })
  @ApiResponse({ status: 201, description: 'User created', type: SystemUserResponseDto })
  create(@Body() createDto: CreateSystemUserDto) {
    return this.systemUsersService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all system users' })
  @ApiResponse({ status: 200, description: 'List of users', type: [SystemUserResponseDto] })
  findAll() {
    return this.systemUsersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a system user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: SystemUserResponseDto })
  findOne(@Param('id') id: string) {
    return this.systemUsersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a system user' })
  @ApiResponse({ status: 200, description: 'User updated', type: SystemUserResponseDto })
  update(@Param('id') id: string, @Body() updateDto: UpdateSystemUserDto) {
    return this.systemUsersService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a system user' })
  remove(@Param('id') id: string) {
    return this.systemUsersService.remove(id);
  }
}

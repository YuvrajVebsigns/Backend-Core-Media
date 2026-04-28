import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SystemUsersService } from './system-users.service';
import { SystemUserRole } from '../common/enums/role.enum';

@Controller('system-users')
export class SystemUsersController {
  constructor(private readonly systemUsersService: SystemUsersService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.systemUsersService.create(createDto);
  }

  @Get()
  findAll() {
    return this.systemUsersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.systemUsersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.systemUsersService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.systemUsersService.remove(id);
  }
}

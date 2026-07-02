import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ContactsService } from './contacts.service';
import { QueryContactDto, ReplyContactDto } from './dto/contact.dto';

@ApiTags('Admin | Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({
    summary: 'Get all contact submissions with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'List of contact submissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() queryDto: QueryContactDto) {
    return this.contactsService.findAll(queryDto);
  }

  @Get(':id')
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN, SystemUserRole.STAFF)
  @ApiOperation({ summary: 'Get contact submission details by ID' })
  @ApiResponse({ status: 200, description: 'Contact submission details' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Post(':id/reply')
  @HttpCode(HttpStatus.OK)
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.ADMIN)
  @ApiOperation({ summary: 'Submit a response/reply to a contact message' })
  @ApiResponse({
    status: 200,
    description: 'Contact submission updated with reply',
  })
  @ApiResponse({ status: 404, description: 'Not Found' })
  reply(
    @Param('id') id: string,
    @Body() replyDto: ReplyContactDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.reply(id, replyDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete a contact submission' })
  @ApiResponse({ status: 244, description: 'No content (success)' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}

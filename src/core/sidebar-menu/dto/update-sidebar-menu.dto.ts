import { PartialType } from '@nestjs/swagger';
import { CreateSidebarMenuDto } from './create-sidebar-menu.dto';

export class UpdateSidebarMenuDto extends PartialType(CreateSidebarMenuDto) {}

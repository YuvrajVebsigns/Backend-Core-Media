import { PartialType } from '@nestjs/swagger';
import { CreateNavbarItemDto } from './create-navbar-item.dto';

export class UpdateNavbarItemDto extends PartialType(CreateNavbarItemDto) {}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedMetaDto } from '../../../common/dto/paginated-response.dto';

export class ParentSidebarMenuDto {
  @ApiProperty({ example: '60d5ecb3ed1e462a5c8e3e4a' })
  id: string;

  @ApiProperty({ example: 'Dashboard' })
  name: string;
}

export class SidebarMenuResponseDto {
  @ApiProperty({ example: '60d5ecb3ed1e462a5c8e3e4a' })
  id: string;

  @ApiProperty({ example: 'Users' })
  name: string;

  @ApiProperty({ example: '/users' })
  path: string;

  @ApiPropertyOptional({ type: ParentSidebarMenuDto, description: 'Populated parent sidebarMenu or null' })
  parentId?: ParentSidebarMenuDto | string | null;

  @ApiProperty({ example: 'users.view' })
  permissionKey: string;

  @ApiPropertyOptional({ example: 'UsersIcon' })
  icon?: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: true })
  isVisible: boolean;

  @ApiPropertyOptional({ example: 'sidebarMenu' })
  group?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedSidebarMenuResponseDto {
  @ApiProperty({ type: [SidebarMenuResponseDto] })
  data: SidebarMenuResponseDto[];

  @ApiProperty({ type: PaginatedMetaDto })
  meta: PaginatedMetaDto;
}

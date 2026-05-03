import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class SidebarMenuPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search term for name, path, permissionKey, or group' })
  @IsString()
  @IsOptional()
  search?: string;
}

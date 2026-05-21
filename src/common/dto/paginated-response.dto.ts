import { ApiProperty } from '@nestjs/swagger';

export class PaginatedMetaDto {
  @ApiProperty({ description: 'Total number of items matching the query' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'True if there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'True if there is a previous page' })
  hasPreviousPage: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'The array of data items for the current page',
    isArray: true,
  })
  data: T[];

  @ApiProperty({ description: 'Pagination metadata', type: PaginatedMetaDto })
  meta: PaginatedMetaDto;
}

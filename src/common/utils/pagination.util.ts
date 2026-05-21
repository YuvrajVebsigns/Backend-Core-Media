import {
  PaginatedMetaDto,
  PaginatedResponseDto,
} from '@common/dto/paginated-response.dto';

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponseDto<T> {
  const totalPages = Math.ceil(total / limit);

  const meta: PaginatedMetaDto = {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  return {
    data,
    meta,
  };
}

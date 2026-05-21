import { ApiProperty } from '@nestjs/swagger';
import { FileResponseDto } from './file-response.dto';

class PaginationMeta {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  pages: number;
}

export class PaginatedFileResponseDto {
  @ApiProperty({ type: [FileResponseDto] })
  files: FileResponseDto[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}

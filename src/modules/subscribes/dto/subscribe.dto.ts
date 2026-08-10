import { IsEmail, IsOptional, IsString, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class CreateSubscribeDto {
  @ApiProperty({ example: 'jane.doe@example.com', description: 'Subscriber email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'footer', description: 'Source or placement of subscribe widget' })
  @IsString()
  @IsOptional()
  source?: string;
}

export class QuerySubscribeDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by website id' })
  @IsMongoId()
  @IsOptional()
  websiteId?: string;
}

import { IsEmail, IsOptional, IsString, IsMongoId, IsArray, ArrayNotEmpty } from 'class-validator';
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

export class SendSelectedSubscribersDto {
  @ApiProperty({
    type: [String],
    example: ['64d8b2c1a9f0d2e1ab123456', '64d8b2c1a9f0d2e1ab123457'],
    description: 'Selected subscriber document IDs',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  subscriberIds: string[];

  @ApiProperty({ example: 'Hello subscribers', description: 'Email subject' })
  @IsString()
  subject: string;

  @ApiProperty({
    example: '<p>Hello team, this is a test email.</p>',
    description: 'HTML email content',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    example: 'website-123',
    description: 'Optional website filter for the campaign',
  })
  @IsMongoId()
  @IsOptional()
  websiteId?: string;
}

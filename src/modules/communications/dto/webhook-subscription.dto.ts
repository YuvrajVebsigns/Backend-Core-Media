import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class CreateWebhookSubscriptionDto {
  @ApiProperty({ example: 'https://my-system.com/webhook-receiver' })
  @IsNotEmpty()
  @IsUrl({}, { message: 'Must be a valid HTTP/HTTPS URL' })
  url: string;

  @ApiProperty({
    example: ['blog.published', 'event.created'],
    description: 'List of events to subscribe to, or ["*"] for all',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  events: string[];

  @ApiProperty({ example: 'secret_signature_key_xyz' })
  @IsNotEmpty()
  @IsString()
  secret: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWebhookSubscriptionDto extends PartialType(
  CreateWebhookSubscriptionDto,
) {}

export class QueryWebhookSubscriptionDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}

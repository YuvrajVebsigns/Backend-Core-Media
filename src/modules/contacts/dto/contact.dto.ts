import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { ContactStatus } from '../schemas/contact.schema';

export class CreateContactDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the contact person',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the contact person',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '+1-555-0199',
    description: 'Phone number of the contact person',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'Web Development',
    description: 'Selected service or topic',
  })
  @IsString()
  @IsNotEmpty()
  service: string;

  @ApiProperty({
    example: 'Hi, I would like to get a quote for a new website.',
    description: 'The contact message',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: '0.eJzNV01vozAM_ZWKV3hFgCTkVU077JhJO0jbabKUQsHmNonE',
    description: 'Cloudflare Turnstile CAPTCHA token',
  })
  @IsString()
  @IsNotEmpty()
  captchaToken: string;
}

export class ReplyContactDto {
  @ApiProperty({
    example: 'Hi John, thank you for reaching out. We have sent you a quote.',
    description: 'The reply message',
  })
  @IsString()
  @IsNotEmpty()
  replyMessage: string;
}

export class QueryContactDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Search term to search by name, email, phone or message content',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: ContactStatus,
    description: 'Filter by status (Pending or Replied)',
  })
  @IsEnum(ContactStatus)
  @IsOptional()
  status?: ContactStatus;

  @ApiPropertyOptional({ description: 'Filter by website ID' })
  @IsMongoId()
  @IsOptional()
  websiteId?: string;
}

import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsMongoId,
  IsObject,
  IsNumber,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ImageLinksDto } from '@common/dto/image-links.dto';
import {
  EventType,
  EventStatus,
  ScheduleType
} from '@modules/event-management/schemas/event.schema';

class EventLocationDto {
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  mapLink?: string;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lng?: number;
}

class AgendaItemDto {
  @IsString()
  time: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  speaker?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

class EventSeoDto {
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({
    type: () => ImageLinksDto,
    description: 'Image links object',
  })
  @IsOptional()
  ogImage?: ImageLinksDto;

  @IsMongoId()
  @IsOptional()
  ogImageId?: string;
}

class EventScheduledEmailDto {
  @IsMongoId()
  templateId: string;

  @IsEnum(ScheduleType)
  scheduleType: ScheduleType;

  @IsNumber()
  @IsOptional()
  daysOffset?: number;

  @IsNumber()
  @IsOptional()
  hoursOffset?: number;

  @IsNumber()
  @IsOptional()
  minutesOffset?: number;

  @IsDateString()
  @IsOptional()
  exactDate?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isProcessed?: boolean;

  @IsMongoId()
  @IsOptional()
  _id?: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsDateString()
  @IsOptional()
  createdAt?: string;

  @IsDateString()
  @IsOptional()
  updatedAt?: string;
}

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsObject()
  description: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({ enum: EventStatus, default: EventStatus.DRAFT })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => EventLocationDto)
  location?: EventLocationDto;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  meetingLink?: string;

  @ApiPropertyOptional({
    type: () => ImageLinksDto,
    description: 'Image links object',
  })
  @IsOptional()
  bannerImage?: ImageLinksDto;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  bannerImageId?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  websites?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  sponsors?: string[];

  @ApiProperty({ type: [AgendaItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgendaItemDto)
  @IsOptional()
  agenda?: AgendaItemDto[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => EventSeoDto)
  seo?: EventSeoDto;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  invitedEmails?: string[];

  @ApiProperty({ type: [EventScheduledEmailDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventScheduledEmailDto)
  @IsOptional()
  scheduledEmails?: EventScheduledEmailDto[];
}

export class UpdateEventDto extends PartialType(CreateEventDto) { }

export class QueryEventDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ enum: EventStatus, required: false })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiProperty({ enum: EventType, required: false })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  websiteId?: string;
}

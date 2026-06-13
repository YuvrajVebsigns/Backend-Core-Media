import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsMongoId,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateEventMeetingDto {
  @ApiProperty({ description: 'ID of the Event' })
  @IsMongoId()
  eventId: string;

  @ApiProperty({ description: 'Agenda index from event agenda' })
  @IsNumber()
  agendaIndex: number;

  @ApiProperty({ description: 'Time of the agenda item' })
  @IsString()
  agendaTime: string;

  @ApiProperty({ description: 'Title of the agenda item' })
  @IsString()
  agendaTitle: string;

  @ApiProperty({ type: [String], description: 'List of Attendee IDs mapped to this slot' })
  @IsArray()
  @IsMongoId({ each: true })
  attendeeIds: string[];

  @ApiProperty({ description: 'ID of the Sponsor' })
  @IsMongoId()
  sponsorId: string;

  @ApiPropertyOptional({ description: 'Optional meeting notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateEventMeetingDto extends PartialType(CreateEventMeetingDto) {}

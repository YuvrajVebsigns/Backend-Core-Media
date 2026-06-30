import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import {
  CommunicationChannel,
  CommunicationStatus,
} from '../schemas/communication-log.schema';

export class QueryCommunicationLogDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'test@example.com', description: 'Search logs by recipient, title, or content' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CommunicationChannel })
  @IsOptional()
  @IsEnum(CommunicationChannel)
  channel?: CommunicationChannel;

  @ApiPropertyOptional({ enum: CommunicationStatus })
  @IsOptional()
  @IsEnum(CommunicationStatus)
  status?: CommunicationStatus;
}

export class SendManualMessageDto {
  @ApiProperty({ enum: CommunicationChannel, example: CommunicationChannel.EMAIL })
  @IsNotEmpty()
  @IsEnum(CommunicationChannel)
  channel: CommunicationChannel;

  @ApiProperty({ example: 'user@example.com', description: 'Email address, phone number, device token, or webhook URL' })
  @IsNotEmpty()
  @IsString()
  recipient: string;

  @ApiProperty({ example: 'Test Notification' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'This is a test notification message' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: { source: 'admin_panel' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  toTitleCase,
  cleanEmail,
  cleanWhitespace,
} from '@common/utils/string.util';

export class CreateCommentDto {
  @ApiProperty({ example: 'John Doe' })
  @Transform(({ value }) => toTitleCase(value))
  @IsString()
  @IsNotEmpty()
  authorName: string;

  @ApiProperty({ example: 'john@example.com' })
  @Transform(({ value }) => cleanEmail(value))
  @IsEmail()
  @IsNotEmpty()
  authorEmail: string;

  @ApiProperty({ example: 'Great blog post!' })
  @Transform(({ value }) => cleanWhitespace(value))
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class UpdateCommentStatusDto {
  @ApiProperty({ enum: ['Pending', 'Approved', 'Rejected'] })
  @IsEnum(['Pending', 'Approved', 'Rejected'])
  @IsNotEmpty()
  status: string;
}

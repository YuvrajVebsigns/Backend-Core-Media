import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  authorName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  authorEmail: string;

  @ApiProperty({ example: 'Great blog post!' })
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

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImageLinksDto {
  @ApiProperty({ description: 'Original image URL' })
  original: string;

  @ApiPropertyOptional({ description: 'Thumbnail image URL (if available)' })
  thumbnail?: string;

  @ApiPropertyOptional({ description: 'Small image URL (if available)' })
  small?: string;

  @ApiPropertyOptional({ description: 'Medium image URL (if available)' })
  medium?: string;

  @ApiPropertyOptional({ description: 'Large image URL (if available)' })
  large?: string;
}

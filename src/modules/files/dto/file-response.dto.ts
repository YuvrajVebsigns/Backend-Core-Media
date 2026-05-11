import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Swagger response schema for a file record.
 * This is a documentation-only class; the actual response is shaped by
 * the global `ResponseInterceptor`.
 */
export class FileResponseDto {
  @ApiProperty({ example: '665abc1234567890abcdef12' })
  id: string;

  @ApiProperty({ example: 'blogs' })
  module: string;

  @ApiProperty({ example: 'post' })
  entityType: string;

  @ApiProperty({ example: 'abc123' })
  entityId: string;

  @ApiProperty({ example: 'hero-banner.png' })
  originalName: string;

  @ApiProperty({ example: 'image/webp' })
  mimeType: string;

  @ApiProperty({ example: 'image' })
  fileType: string;

  @ApiProperty({ example: 245760 })
  size: number;

  @ApiProperty({ example: 'public' })
  visibility: string;

  @ApiProperty({
    example: { width: 1920, height: 1080, alt: 'Hero banner', blurhash: null },
  })
  metadata: {
    width: number | null;
    height: number | null;
    alt: string;
    blurhash: string | null;
  };

  @ApiProperty({
    description: 'Keywords for easy searching',
    example: ['hero', 'banner', 'launch'],
  })
  keywords: string[];

  @ApiProperty({
    example: 'ready',
  })
  status: string;

  @ApiProperty({
    description: 'Full public CDN URL for the original file',
    example: 'https://cdn.coremedia.com/prod/blogs/post/abc123/original/550e8400.webp',
  })
  url: string;

  @ApiProperty({
    description: 'Transformed URLs for all processed variants (thumbnail, large, etc)',
    example: {
      thumbnail: 'https://cdn.coremedia.com/prod/blogs/post/abc123/thumbnail/550e8400.webp',
      large: 'https://cdn.coremedia.com/prod/blogs/post/abc123/large/550e8400.webp',
    },
  })
  variants: Record<string, string>;
}

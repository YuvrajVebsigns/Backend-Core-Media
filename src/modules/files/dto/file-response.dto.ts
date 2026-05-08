import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Swagger response schema for a file record.
 * This is a documentation-only class; the actual response is shaped by
 * the global `ResponseInterceptor`.
 */
export class FileResponseDto {
  @ApiProperty({ example: '665abc1234567890abcdef12' })
  id: string;

  @ApiProperty({ example: 'zatacloud' })
  provider: string;

  @ApiProperty({ example: 'core-media' })
  bucket: string;

  @ApiProperty({
    example: 'prod/blogs/post/abc123/original/550e8400.webp',
  })
  key: string;

  @ApiProperty({ example: 'blogs' })
  module: string;

  @ApiProperty({ example: 'post' })
  entityType: string;

  @ApiProperty({ example: 'abc123' })
  entityId: string;

  @ApiProperty({ example: 'hero-banner.png' })
  originalName: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000.webp' })
  filename: string;

  @ApiProperty({ example: 'image/webp' })
  mimeType: string;

  @ApiProperty({ example: 'webp' })
  extension: string;

  @ApiProperty({ example: 'image' })
  fileType: string;

  @ApiProperty({ example: 245760 })
  size: number;

  @ApiProperty({ example: 'public' })
  visibility: string;

  @ApiProperty({ example: '665abc1234567890abcdef00' })
  uploadedBy: string;

  @ApiProperty({
    example: { width: 1920, height: 1080, alt: 'Hero banner', blurhash: null },
  })
  metadata: {
    width: number | null;
    height: number | null;
    alt: string;
    blurhash: string | null;
  };

  @ApiProperty({ example: 'processing' })
  status: string;

  @ApiPropertyOptional({
    description: 'Generated CDN URL (only returned from /url endpoint)',
    example: 'https://cdn.coremedia.com/prod/blogs/post/abc123/original/550e8400.webp',
  })
  url?: string;

  @ApiPropertyOptional({
    description: 'Variant map (populated after processing completes)',
    example: {
      thumbnail: {
        key: 'prod/blogs/post/abc123/thumbnail/550e8400.webp',
        width: 150,
        height: 84,
        size: 4096,
      },
    },
  })
  variants?: Record<string, { key: string; width: number; height: number; size: number }>;
}

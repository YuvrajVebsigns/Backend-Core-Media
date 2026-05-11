import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Builds public CDN URLs from a file key.
 *
 * NEVER stores full URLs in the database.
 * Always computes URLs at runtime from `CDN_URL` config.
 */
@Injectable()
export class UrlService {
  private readonly cdnBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.cdnBaseUrl = (
      this.configService.get<string>('CDN_URL', 'http://localhost:8080/uploads')
    ).replace(/\/+$/, ''); // strip trailing slashes
  }

  /**
   * Build the public CDN URL for a given storage key.
   */
  getPublicUrl(key: string): string {
    return `${this.cdnBaseUrl}/${key}`;
  }

  /**
   * Build public URLs for all variants of a file.
   */
  getVariantUrls(
    variants: Map<string, { key: string }> | Record<string, { key: string }>,
  ): Record<string, string> {
    const urls: Record<string, string> = {};

    const entries =
      variants instanceof Map ? variants.entries() : Object.entries(variants);

    for (const [variant, info] of entries) {
      urls[variant] = this.getPublicUrl(info.key);
    }

    return urls;
  }
}

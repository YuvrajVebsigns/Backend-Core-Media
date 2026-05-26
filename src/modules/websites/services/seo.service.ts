import { Injectable, BadRequestException } from '@nestjs/common';
import { ISeoMeta } from '../interfaces/seo.interface';
import { validateSeo } from '../utils/seo-validator';

@Injectable()
export class SeoService {
  processAndValidateSeo(seo: ISeoMeta): ISeoMeta {
    if (!seo) return {};

    const validation = validateSeo(seo);
    if (!validation.isValid) {
      throw new BadRequestException(`SEO validation failed: ${validation.errors.join(', ')}`);
    }

    return {
      ...seo,
      robots: seo.robots || 'index, follow',
      noIndex: seo.noIndex ?? false,
      noFollow: seo.noFollow ?? false,
    };
  }
}

import { ISeoMeta } from '../interfaces/seo.interface';

export function validateSeo(seo: ISeoMeta): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (seo.metaTitle && seo.metaTitle.length > 60) {
    errors.push('Meta title should be 60 characters or less for optimal display.');
  }

  if (seo.metaDescription && seo.metaDescription.length > 160) {
    errors.push('Meta description should be 160 characters or less for optimal display.');
  }

  if (seo.schemaMarkup) {
    try {
      JSON.parse(seo.schemaMarkup);
    } catch (e) {
      errors.push('Schema markup is not valid JSON-LD.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface ISeoMeta {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageId?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImageId?: string;
  schemaMarkup?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

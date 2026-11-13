/**
 * JSON-LD builders (TDD §H.59). Each returns a plain object that is safe to
 * pass to JSON.stringify. Use toJsonLd() to put one in a <script> tag.
 */
import { SITE, absoluteUrl } from '../../config/site';

type JsonLd = Record<string, unknown>;

const CONTEXT = 'https://schema.org';

export interface FaqItem {
  q: string;
  a: string;
}

export interface Crumb {
  name: string;
  /** Path starting with a slash, for example /paint-calculator/. */
  path: string;
}

export interface ArticleInput {
  headline: string;
  description: string;
  path: string;
  /** ISO 8601 date. */
  datePublished: string;
  /** ISO 8601 date. Defaults to datePublished. */
  dateModified?: string;
}

function publisher(): JsonLd {
  return { '@type': 'Organization', name: SITE.name, url: SITE.url };
}

export function websiteSchema(description: string): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    name: SITE.name,
    url: `${SITE.url}/`,
    description,
  };
}

export function webApplicationSchema(name: string, description: string, path: string): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'WebApplication',
    name,
    description,
    url: absoluteUrl(path),
    applicationCategory: 'HomeApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: publisher(),
  };
}

export function faqSchema(items: readonly FaqItem[]): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function breadcrumbSchema(crumbs: readonly Crumb[]): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function articleSchema(input: ArticleInput): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: publisher(),
    publisher: publisher(),
  };
}

/**
 * Serialise for a <script type="application/ld+json"> tag. Characters that could end
 * the script element or start a comment are escaped, so text can never break out.
 */
export function toJsonLd(data: JsonLd): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

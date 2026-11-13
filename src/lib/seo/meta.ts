/**
 * Title, description and canonical builders (TDD §H.56, §H.61).
 * Titles are at most 60 characters and descriptions at most 155. Builders shorten
 * text on a word boundary instead of exceeding the limit.
 */
import { SITE, absoluteUrl } from '../../config/site';

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

export interface PageMeta {
  title: string;
  description: string;
  /** Absolute canonical URL with a trailing slash and no query. */
  canonical: string;
  ogImage: string;
  /** Always summary_large_image (TDD §H.56). */
  twitterCard: 'summary_large_image';
}

const SUFFIX = ' | Roomtally';

export const HOME_TITLE = 'Roomtally: Paint, Flooring & Tile Calculator in One List';
export const HOME_DESCRIPTION =
  'Enter your room once to get a shopping list for paint, flooring, tile and wallpaper, rounded to real pack sizes.';

/** Shorten text to a limit, cutting at a word boundary and adding an ellipsis. */
export function clamp(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s.,;:!?-]+$/, '')}…`;
}

/** Absolute canonical URL: origin + path, trailing slash, no query or fragment (§H.61). */
export function canonicalUrl(path: string): string {
  const pathOnly = (path.split(/[?#]/)[0] ?? '').trim();
  const withLead = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  const withTrail = withLead.endsWith('/') ? withLead : `${withLead}/`;
  return absoluteUrl(withTrail.replace(/\/{2,}/g, '/'));
}

function build(title: string, description: string, path: string): PageMeta {
  return {
    title: clamp(title, TITLE_MAX),
    description: clamp(description, DESCRIPTION_MAX),
    canonical: canonicalUrl(path),
    ogImage: absoluteUrl(SITE.ogImage),
    twitterCard: 'summary_large_image',
  };
}

/** "{Name}{suffix}" where the name is shortened so the whole title fits. */
function withSuffix(name: string): string {
  return `${clamp(name, TITLE_MAX - SUFFIX.length)}${SUFFIX}`;
}

export function homeMeta(): PageMeta {
  return build(HOME_TITLE, HOME_DESCRIPTION, '/');
}

/** Calculator page, for example material "Paint" at /paint-calculator/. */
export function calculatorMeta(material: string, description: string, path: string): PageMeta {
  return build(`${material} Calculator: How Much Do I Need?${SUFFIX}`, description, path);
}

/** Room-type page, for example room "Bedroom" at /paint-calculator/bedroom/. */
export function roomMeta(room: string, description: string, path: string): PageMeta {
  return build(`${room} Paint Calculator: How Much Paint?${SUFFIX}`, description, path);
}

export function guideMeta(title: string, description: string, path: string): PageMeta {
  return build(withSuffix(title), description, path);
}

export function legalMeta(page: string, description: string, path: string): PageMeta {
  return build(withSuffix(page), description, path);
}

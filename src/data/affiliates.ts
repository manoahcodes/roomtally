/**
 * Affiliate partner table (PRD Rule 15). Link URLs are built only from this
 * table plus the tag held in an environment variable. No URL, query or stored
 * value is ever used to build a link (TDD §E).
 *
 * ⚠ Every partner stays disabled until the owner confirms an approved program
 * for that region (PRD §6). Amazon Associates exists in all four regions, but
 * approval and terms are the owner's to confirm.
 */
import type { MaterialId, Region } from '../types/project';

export interface AffiliatePartner {
  id: string;
  name: string;
  region: Region;
  category: 'home-improvement';
  /** Contains {query} and {tag}. */
  urlTemplate: string;
  /** Name of the PUBLIC_ variable that holds the tag. */
  tagEnvVar: string;
  /** Search phrase per material category. */
  queries: Readonly<Record<MaterialId, string>>;
  /** Stays false until the program is approved. */
  enabled: boolean;
}

const QUERIES: Readonly<Record<MaterialId, string>> = {
  paint: 'interior wall paint',
  flooring: 'laminate flooring',
  tile: 'floor tiles',
  wallpaper: 'wallpaper roll',
};

export const AFFILIATE_PARTNERS: readonly AffiliatePartner[] = [
  {
    id: 'amazon-us',
    name: 'Amazon',
    region: 'US',
    category: 'home-improvement',
    urlTemplate: 'https://www.amazon.com/s?k={query}&tag={tag}',
    tagEnvVar: 'PUBLIC_AFFILIATE_TAG_AMAZON_US',
    queries: QUERIES,
    enabled: false,
  },
  {
    id: 'amazon-uk',
    name: 'Amazon',
    region: 'UK',
    category: 'home-improvement',
    urlTemplate: 'https://www.amazon.co.uk/s?k={query}&tag={tag}',
    tagEnvVar: 'PUBLIC_AFFILIATE_TAG_AMAZON_UK',
    queries: QUERIES,
    enabled: false,
  },
  {
    id: 'amazon-ca',
    name: 'Amazon',
    region: 'CA',
    category: 'home-improvement',
    urlTemplate: 'https://www.amazon.ca/s?k={query}&tag={tag}',
    tagEnvVar: 'PUBLIC_AFFILIATE_TAG_AMAZON_CA',
    queries: QUERIES,
    enabled: false,
  },
  {
    id: 'amazon-au',
    name: 'Amazon',
    region: 'AU',
    category: 'home-improvement',
    urlTemplate: 'https://www.amazon.com.au/s?k={query}&tag={tag}',
    tagEnvVar: 'PUBLIC_AFFILIATE_TAG_AMAZON_AU',
    queries: QUERIES,
    enabled: false,
  },
];

export function getPartner(id: string): AffiliatePartner | undefined {
  return AFFILIATE_PARTNERS.find((partner) => partner.id === id);
}

export function partnerForRegion(region: Region): AffiliatePartner | undefined {
  return AFFILIATE_PARTNERS.find((partner) => partner.region === region);
}

/**
 * Build a link from the static table and a tag. Returns null when the partner
 * is disabled or the tag is empty, so no tag-less or half-built link is shown.
 */
export function buildAffiliateUrl(
  partner: AffiliatePartner,
  material: MaterialId,
  tag: string | undefined,
): string | null {
  if (!partner.enabled || !tag) return null;
  return partner.urlTemplate
    .replace('{query}', encodeURIComponent(partner.queries[material]))
    .replace('{tag}', encodeURIComponent(tag));
}

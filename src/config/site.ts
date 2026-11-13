export interface NavItem {
  label: string;
  href: string;
}

const env = (import.meta.env ?? {}) as unknown as Record<string, string | undefined>;
const rawUrl = env.PUBLIC_SITE_URL ?? 'https://roomtally.example';

export const SITE = {
  name: 'Roomtally',
  tagline: 'Measure once. Buy right.',
  /** Canonical origin without a trailing slash. */
  url: rawUrl.replace(/\/+$/, ''),
  ogImage: '/og-default.png',
} as const;

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Paint', href: '/paint-calculator/' },
  { label: 'Flooring', href: '/flooring-calculator/' },
  { label: 'Tile', href: '/tile-calculator/' },
  { label: 'Wallpaper', href: '/wallpaper-calculator/' },
  { label: 'Guides', href: '/guides/' },
];

export const LEGAL_LINKS: readonly NavItem[] = [
  { label: 'About', href: '/about/' },
  { label: 'Privacy', href: '/privacy/' },
  { label: 'Cookies', href: '/cookies/' },
  { label: 'Terms', href: '/terms/' },
  { label: 'Disclaimer', href: '/disclaimer/' },
];

/** Absolute URL for a path that starts with a slash. */
export function absoluteUrl(path: string): string {
  return `${SITE.url}${path}`;
}

/**
 * Technical SEO (TDD §H): every public route in App_Flow §A.1 has one h1, a title of at
 * most 60 characters, a description of at most 155, an absolute canonical that matches its
 * own path, Open Graph and Twitter tags, no noindex, and JSON-LD that parses and carries
 * the schema types TDD §H.59 lists for that kind of page. Also checks robots.txt, the
 * sitemap, the 404 page and that every internal link on those pages resolves.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

type Kind = 'home' | 'calculator' | 'guides-index' | 'guide' | 'legal';

/** Schema types required per kind of page (TDD §H.59). More types are allowed. */
const REQUIRED_TYPES: Record<Kind, string[]> = {
  home: ['WebSite', 'WebApplication', 'FAQPage'],
  calculator: ['WebApplication', 'FAQPage', 'BreadcrumbList'],
  'guides-index': ['BreadcrumbList'],
  guide: ['Article', 'BreadcrumbList', 'FAQPage'],
  legal: ['BreadcrumbList'],
};

const ROUTES: { path: string; kind: Kind }[] = [
  { path: '/', kind: 'home' },
  { path: '/paint-calculator/', kind: 'calculator' },
  { path: '/paint-calculator/bedroom/', kind: 'calculator' },
  { path: '/paint-calculator/living-room/', kind: 'calculator' },
  { path: '/paint-calculator/kitchen/', kind: 'calculator' },
  { path: '/paint-calculator/bathroom/', kind: 'calculator' },
  { path: '/flooring-calculator/', kind: 'calculator' },
  { path: '/tile-calculator/', kind: 'calculator' },
  { path: '/wallpaper-calculator/', kind: 'calculator' },
  { path: '/guides/', kind: 'guides-index' },
  { path: '/guides/how-much-paint-for-a-room/', kind: 'guide' },
  { path: '/guides/flooring-waste-factor/', kind: 'guide' },
  { path: '/guides/how-to-measure-a-room/', kind: 'guide' },
  { path: '/guides/tile-layout-and-waste/', kind: 'guide' },
  { path: '/about/', kind: 'legal' },
  { path: '/privacy/', kind: 'legal' },
  { path: '/cookies/', kind: 'legal' },
  { path: '/terms/', kind: 'legal' },
  { path: '/disclaimer/', kind: 'legal' },
];

/** The @type values of every JSON-LD block on the page. Throws if any block is not valid JSON. */
async function schemaTypes(page: Page): Promise<string[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types: string[] = [];
  const collect = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(collect);
    if (typeof node !== 'object' || node === null) return;
    const record = node as Record<string, unknown>;
    const type = record['@type'];
    if (typeof type === 'string') types.push(type);
    if (Array.isArray(type)) types.push(...type.filter((t): t is string => typeof t === 'string'));
    if ('@graph' in record) collect(record['@graph']);
  };
  for (const text of blocks) collect(JSON.parse(text));
  return types;
}

for (const route of ROUTES) {
  test.describe(`SEO: ${route.path}`, () => {
    test.beforeEach(async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
    });

    test('has one h1, one title and one description within the limits', async ({ page }) => {
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).not.toBeEmpty();

      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
      expect(title.length).toBeLessThanOrEqual(60);
      await expect(page.locator('head title')).toHaveCount(1);

      const description = page.locator('meta[name="description"]');
      await expect(description).toHaveCount(1);
      const text = (await description.getAttribute('content')) ?? '';
      expect(text.length).toBeGreaterThan(0);
      expect(text.length).toBeLessThanOrEqual(155);
    });

    test('has an absolute canonical for its own path and no noindex', async ({ page }) => {
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      const href = (await canonical.getAttribute('href')) ?? '';
      expect(href).toMatch(/^https?:\/\//);
      const url = new URL(href);
      expect(url.pathname).toBe(route.path);
      expect(url.search).toBe('');
      expect(url.hash).toBe('');

      // No robots tag means "index, follow", so read it without waiting for it to exist.
      const robots = await page.evaluate(
        () => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
      );
      expect(robots).not.toMatch(/noindex/i);
      expect(await page.locator('html').getAttribute('lang')).toBe('en');
      await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
    });

    test('has Open Graph and Twitter tags that match the page', async ({ page }) => {
      const title = await page.title();
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
      await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        /^https?:\/\/.+og-default\.png$/,
      );
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        canonical ?? '',
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        'content',
        'summary_large_image',
      );
    });

    test('has JSON-LD that parses and carries the right types', async ({ page }) => {
      const types = await schemaTypes(page);
      for (const required of REQUIRED_TYPES[route.kind]) {
        expect(types, `${route.path} should include ${required}`).toContain(required);
      }
      // One FAQPage at most: FaqBlock owns it, so no page may emit it twice.
      expect(types.filter((type) => type === 'FAQPage').length).toBeLessThanOrEqual(1);
    });
  });
}

test.describe('SEO: site files', () => {
  test('robots.txt allows crawling and names the sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toMatch(/User-agent: \*/);
    expect(text).toMatch(/Allow: \//);
    expect(text).not.toMatch(/^Disallow:\s*\S/m);
    expect(text).toMatch(/Sitemap: https?:\/\/\S+\/sitemap-index\.xml/);
  });

  test('the sitemap lists every route and leaves out the 404 page', async ({ request }) => {
    const index = await request.get('/sitemap-index.xml');
    expect(index.status()).toBe(200);
    const indexText = await index.text();
    const files = [...indexText.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => new URL(m[1] ?? '').pathname,
    );
    expect(files.length).toBeGreaterThan(0);

    const paths: string[] = [];
    for (const file of files) {
      const sitemap = await request.get(file);
      expect(sitemap.status()).toBe(200);
      const text = await sitemap.text();
      paths.push(
        ...[...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1] ?? '').pathname),
      );
    }
    for (const route of ROUTES) expect(paths, `${route.path} in sitemap`).toContain(route.path);
    expect(paths.some((path) => path.includes('404'))).toBe(false);
  });
});

test.describe('SEO: not found', () => {
  test('an unknown address returns 404 with the NAV_404 message and no JSON-LD', async ({
    page,
  }) => {
    const response = await page.goto('/no-such-page/');
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText("We couldn't find that page.");
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });
});

test.describe('SEO: internal links', () => {
  test('every internal link on every route resolves', async ({ page, request }) => {
    const targets = new Set<string>();
    for (const route of ROUTES) {
      await page.goto(route.path);
      const hrefs = await page
        .locator('a[href^="/"]:not([href^="//"])')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
      for (const href of hrefs) targets.add(href.split('#')[0] || route.path);
    }
    expect(targets.size).toBeGreaterThanOrEqual(ROUTES.length);

    for (const target of targets) {
      const response = await request.get(target);
      expect(response.status(), `${target} should resolve`).toBe(200);
    }
  });
});

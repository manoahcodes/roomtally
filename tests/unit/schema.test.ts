import { describe, expect, it } from 'vitest';
import {
  articleSchema,
  breadcrumbSchema,
  faqSchema,
  toJsonLd,
  webApplicationSchema,
  websiteSchema,
} from '../../src/lib/seo/schema';
import {
  DESCRIPTION_MAX,
  HOME_DESCRIPTION,
  HOME_TITLE,
  TITLE_MAX,
  calculatorMeta,
  canonicalUrl,
  clamp,
  guideMeta,
  homeMeta,
  legalMeta,
  roomMeta,
} from '../../src/lib/seo/meta';
import { ROOM_TYPES } from '../../src/data/rooms';

const ORIGIN = 'https://roomtally.example';

describe('websiteSchema', () => {
  it('has the required fields', () => {
    const s = websiteSchema('A description');
    expect(s['@context']).toBe('https://schema.org');
    expect(s['@type']).toBe('WebSite');
    expect(s.name).toBe('Roomtally');
    expect(s.url).toBe(`${ORIGIN}/`);
    expect(s.description).toBe('A description');
  });
});

describe('webApplicationSchema', () => {
  const s = webApplicationSchema('Paint calculator', 'Works out paint.', '/paint-calculator/');
  it('has the required fields', () => {
    expect(s['@type']).toBe('WebApplication');
    expect(s.name).toBe('Paint calculator');
    expect(s.url).toBe(`${ORIGIN}/paint-calculator/`);
    expect(s.applicationCategory).toBe('HomeApplication');
    expect(s.isAccessibleForFree).toBe(true);
  });
  it('is free', () => {
    expect(s.offers).toEqual({ '@type': 'Offer', price: '0', priceCurrency: 'USD' });
  });
});

describe('faqSchema', () => {
  it('maps each question and answer', () => {
    const s = faqSchema([
      { q: 'One?', a: 'First.' },
      { q: 'Two?', a: 'Second.' },
    ]);
    expect(s['@type']).toBe('FAQPage');
    const main = s.mainEntity as Record<string, unknown>[];
    expect(main).toHaveLength(2);
    expect(main[0]).toEqual({
      '@type': 'Question',
      name: 'One?',
      acceptedAnswer: { '@type': 'Answer', text: 'First.' },
    });
  });
  it('works with the room-type FAQs', () => {
    const room = ROOM_TYPES[0]!;
    const main = faqSchema(room.faqs).mainEntity as unknown[];
    expect(main).toHaveLength(3);
  });
});

describe('breadcrumbSchema', () => {
  it('numbers the items from 1 and uses absolute URLs', () => {
    const s = breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Paint', path: '/paint-calculator/' },
    ]);
    expect(s['@type']).toBe('BreadcrumbList');
    const items = s.itemListElement as Record<string, unknown>[];
    expect(items.map((i) => i.position)).toEqual([1, 2]);
    expect(items[1]!.item).toBe(`${ORIGIN}/paint-calculator/`);
    expect(items[1]!.name).toBe('Paint');
  });
});

describe('articleSchema', () => {
  const base = {
    headline: 'How to measure a room',
    description: 'Measure it once.',
    path: '/guides/measure-a-room/',
    datePublished: '2026-01-05',
  };
  it('has the required fields', () => {
    const s = articleSchema(base);
    expect(s['@type']).toBe('Article');
    expect(s.headline).toBe(base.headline);
    expect(s.url).toBe(`${ORIGIN}/guides/measure-a-room/`);
    expect(s.datePublished).toBe('2026-01-05');
    expect(s.author).toEqual({ '@type': 'Organization', name: 'Roomtally', url: ORIGIN });
  });
  it('uses the publish date when there is no modified date', () => {
    expect(articleSchema(base).dateModified).toBe('2026-01-05');
    expect(articleSchema({ ...base, dateModified: '2026-02-01' }).dateModified).toBe('2026-02-01');
  });
});

describe('toJsonLd', () => {
  it('produces valid JSON that parses back to the same data', () => {
    const s = faqSchema([{ q: 'Q?', a: 'A.' }]);
    expect(JSON.parse(toJsonLd(s))).toEqual(s);
  });
  it('escapes characters that could break out of a script tag', () => {
    const out = toJsonLd(faqSchema([{ q: '</script><img src=x onerror=alert(1)>', a: 'a & b' }]));
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).not.toContain('&');
    expect(JSON.parse(out).mainEntity[0].name).toBe('</script><img src=x onerror=alert(1)>');
  });
});

describe('clamp', () => {
  it('leaves short text alone and collapses spaces', () => {
    expect(clamp('  a   b ', 10)).toBe('a b');
  });
  it('shortens on a word boundary with an ellipsis, within the limit', () => {
    const out = clamp('one two three four five six seven', 20);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out.endsWith('…')).toBe(true);
    expect(out).toBe('one two three four…');
  });
  it('cuts a single very long word', () => {
    const out = clamp('x'.repeat(100), 10);
    expect(out).toHaveLength(10);
  });
});

describe('canonicalUrl', () => {
  it('is absolute with a trailing slash', () => {
    expect(canonicalUrl('/')).toBe(`${ORIGIN}/`);
    expect(canonicalUrl('/paint-calculator')).toBe(`${ORIGIN}/paint-calculator/`);
    expect(canonicalUrl('guides/x/')).toBe(`${ORIGIN}/guides/x/`);
  });
  it('drops query strings and fragments', () => {
    expect(canonicalUrl('/tile-calculator/?utm=1#top')).toBe(`${ORIGIN}/tile-calculator/`);
  });
});

describe('page meta', () => {
  it('home uses the exact title and description from the spec', () => {
    const m = homeMeta();
    expect(m.title).toBe('Roomtally: Paint, Flooring & Tile Calculator in One List');
    expect(m.description).toBe(HOME_DESCRIPTION);
    expect(m.canonical).toBe(`${ORIGIN}/`);
    expect(m.twitterCard).toBe('summary_large_image');
    expect(m.ogImage).toBe(`${ORIGIN}/og-default.png`);
  });
  it('the home title and description fit the limits unchanged', () => {
    expect(HOME_TITLE.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(HOME_DESCRIPTION.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });
  it('calculator titles follow the pattern', () => {
    const m = calculatorMeta('Flooring', 'Works out flooring.', '/flooring-calculator/');
    expect(m.title).toBe('Flooring Calculator: How Much Do I Need? | Roomtally');
    expect(m.canonical).toBe(`${ORIGIN}/flooring-calculator/`);
  });
  it('room titles follow the pattern and every room type fits', () => {
    for (const room of ROOM_TYPES) {
      const m = roomMeta(room.name, room.intro, `/paint-calculator/${room.slug}/`);
      expect(m.title).toBe(`${room.name} Paint Calculator: How Much Paint? | Roomtally`);
      expect(m.title.length).toBeLessThanOrEqual(TITLE_MAX);
      expect(m.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    }
  });
  it('guide and legal titles end with the site name and never pass 60 characters', () => {
    const long = 'A very long guide title that would go well past the sixty character limit';
    const g = guideMeta(long, 'Summary.', '/guides/long/');
    expect(g.title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(g.title.endsWith(' | Roomtally')).toBe(true);
    expect(legalMeta('Privacy', 'How we handle data.', '/privacy/').title).toBe('Privacy | Roomtally');
  });
  it('shortens an over-long description to 155 characters', () => {
    const m = guideMeta('Guide', 'word '.repeat(60), '/guides/g/');
    expect(m.description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
  });
});

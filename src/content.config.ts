/**
 * Content collections (App_Flow §A.1). One collection: the four guides in
 * src/content/guides/. Front matter is checked at build time, so a guide with a missing
 * title, a bad date or a malformed FAQ fails the build instead of reaching the site.
 *
 * Imports follow the current Astro docs: defineCollection from astro:content,
 * glob from astro/loaders and z from astro/zod.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const guides = defineCollection({
  loader: glob({ base: './src/content/guides', pattern: '**/*.md' }),
  schema: z.object({
    /** Article headline, used as the h1 and in the title tag. */
    title: z.string().min(1).max(80),
    /** Meta description, at most 155 characters (TDD §H.56). */
    description: z.string().min(1).max(155),
    /** First published, for example 2026-11-14. */
    published: z.coerce.date(),
    /** Last updated. Shown on the page and in the Article JSON-LD. */
    updated: z.coerce.date(),
    /** Position on the guides index, lowest first. */
    order: z.number().int().default(100),
    /** Questions shown in the FAQ block under the article. */
    faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).default([]),
  }),
});

export const collections = { guides };

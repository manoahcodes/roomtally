#!/usr/bin/env node
/**
 * SEO check (TDD §H). Scans the built HTML in dist/ and fails on the mistakes that cost
 * rankings: a missing or over-long title or description, a missing or wrong canonical,
 * zero or several h1 elements, an accidental noindex, missing Open Graph or Twitter tags,
 * and JSON-LD that does not parse. Also checks that robots.txt and the sitemap exist.
 * Run after `pnpm run build`: `pnpm run seo:check`.
 *
 * Only built-in Node modules are used. HTML is read with small regular expressions that
 * respect quoted attributes, because Astro may leave attribute values unquoted.
 * Usage: node scripts/check-seo.mjs [distDir]   (default: dist)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const MAX_TITLE = 60;
export const MAX_DESCRIPTION = 155;

/** Every .html file under a folder, as absolute paths. */
export function findHtml(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...findHtml(full));
    else if (name.endsWith('.html')) found.push(full);
  }
  return found;
}

/** dist/a/b/index.html -> /a/b/, dist/index.html -> /, dist/404.html -> /404/ */
export function routeFor(dist, file) {
  const rel = relative(dist, file).split('\\').join('/');
  const withoutIndex = rel.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '/');
  return '/' + withoutIndex.replace(/^\/+/, '');
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decode(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[name.toLowerCase()] ?? whole);
}

/** Attributes of one tag as a plain object. Handles "double", 'single' and unquoted values. */
export function parseAttrs(source) {
  const attrs = {};
  const pattern = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    attrs[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

/** All tags with this name, as attribute objects. */
function tags(html, name) {
  const pattern = new RegExp(`<${name}\\b((?:"[^"]*"|'[^']*'|[^>"'])*)>`, 'gi');
  return [...html.matchAll(pattern)].map((match) => parseAttrs(match[1]));
}

/** Check one page. Returns a list of problems, empty when the page is fine. */
export function checkPage(html, route) {
  const problems = [];
  const is404 = route === '/404/';

  if (!/<html\b[^>]*\blang=/i.test(html)) problems.push('html element has no lang attribute');

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decode(titleMatch[1]).trim() : '';
  if (!title) problems.push('missing <title>');
  else if (title.length > MAX_TITLE) problems.push(`title is ${title.length} characters (max ${MAX_TITLE}): "${title}"`);

  const metas = tags(html, 'meta');
  const meta = (key, value) => metas.filter((m) => m[key] === value);

  const descriptions = meta('name', 'description');
  if (descriptions.length !== 1) problems.push(`expected one meta description, found ${descriptions.length}`);
  else {
    const text = (descriptions[0].content ?? '').trim();
    if (!text) problems.push('meta description is empty');
    else if (text.length > MAX_DESCRIPTION) {
      problems.push(`meta description is ${text.length} characters (max ${MAX_DESCRIPTION})`);
    }
  }

  const canonicals = tags(html, 'link').filter((l) => (l.rel ?? '').toLowerCase() === 'canonical');
  let canonical = '';
  if (canonicals.length !== 1) problems.push(`expected one canonical link, found ${canonicals.length}`);
  else {
    canonical = canonicals[0].href ?? '';
    try {
      const url = new URL(canonical);
      if (!/^https?:$/.test(url.protocol)) problems.push(`canonical is not http(s): ${canonical}`);
      else if (url.pathname !== route) problems.push(`canonical path ${url.pathname} does not match ${route}`);
    } catch {
      problems.push(`canonical is not an absolute URL: "${canonical}"`);
    }
  }

  // Count h1 in the visible page only: not inside scripts, styles or templates.
  const visible = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<template\b[\s\S]*?<\/template>/gi, '');
  const h1Count = (visible.match(/<h1[\s>]/gi) ?? []).length;
  if (h1Count !== 1) problems.push(`expected one h1, found ${h1Count}`);

  for (const robots of meta('name', 'robots')) {
    if (/noindex/i.test(robots.content ?? '')) problems.push(`noindex found: "${robots.content}"`);
  }

  for (const property of ['og:title', 'og:description', 'og:url', 'og:image']) {
    const found = meta('property', property);
    if (found.length === 0 || !(found[0].content ?? '').trim()) problems.push(`missing ${property}`);
  }
  const card = meta('name', 'twitter:card')[0];
  if (card?.content !== 'summary_large_image') problems.push('twitter:card must be summary_large_image');
  const ogUrl = meta('property', 'og:url')[0]?.content;
  if (canonical && ogUrl && ogUrl !== canonical) problems.push(`og:url (${ogUrl}) differs from canonical (${canonical})`);

  const ldBlocks = [...html.matchAll(/<script\b[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)];
  if (is404 && ldBlocks.length > 0) problems.push('404 page must not have JSON-LD (TDD §H.59)');
  ldBlocks.forEach((block, index) => {
    try {
      const data = JSON.parse(block[1]);
      if (!data || typeof data !== 'object' || !data['@type']) problems.push(`JSON-LD block ${index + 1} has no @type`);
    } catch (error) {
      problems.push(`JSON-LD block ${index + 1} does not parse: ${error.message}`);
    }
  });

  return problems;
}

/** Site-wide files that must exist after a build. */
export function checkSiteFiles(dist) {
  const problems = [];
  const robots = join(dist, 'robots.txt');
  if (!existsSync(robots)) problems.push('robots.txt is missing from dist/');
  else if (!/^Sitemap:\s*\S+/im.test(readFileSync(robots, 'utf8'))) problems.push('robots.txt has no Sitemap line');
  if (!existsSync(join(dist, 'sitemap-index.xml'))) problems.push('sitemap-index.xml is missing from dist/');
  return problems;
}

function main() {
  const dist = resolve(process.argv[2] ?? 'dist');
  let files;
  try {
    files = findHtml(dist);
  } catch {
    console.error(`Cannot read ${dist}. Run "pnpm run build" first.`);
    process.exit(1);
  }
  if (files.length === 0) {
    console.error(`No HTML files found in ${dist}. Is this the build folder?`);
    process.exit(1);
  }

  let failed = 0;
  for (const file of files.sort()) {
    const route = routeFor(dist, file);
    const problems = checkPage(readFileSync(file, 'utf8'), route);
    if (problems.length > 0) {
      failed += 1;
      console.error(`FAIL ${route}`);
      for (const problem of problems) console.error(`  - ${problem}`);
    }
  }
  const siteProblems = checkSiteFiles(dist);
  for (const problem of siteProblems) console.error(`FAIL site: ${problem}`);

  console.log(`Checked ${files.length} pages: ${files.length - failed} fine, ${failed} with problems.`);
  if (failed > 0 || siteProblems.length > 0) process.exit(1);
  console.log('OK: no SEO problems found.');
}

// Run only when started from the command line, so tests can import the helpers.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}

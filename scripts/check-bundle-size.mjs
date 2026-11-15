#!/usr/bin/env node
/**
 * Bundle size check (TDD §F.46). Fails when the total gzip size of the first-party
 * JavaScript in dist/ is over 60 KB, and prints the largest files so the cause is easy
 * to find. Run after `pnpm run build`: `pnpm run size`.
 *
 * Only built-in Node modules are used, so it runs in CI without extra installs.
 * Usage: node scripts/check-bundle-size.mjs [distDir]   (default: dist)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export const BUDGET_KB = 60;
const KB = 1024;

/** Every .js and .mjs file under a folder, as absolute paths. */
export function findScripts(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...findScripts(full));
    else if (/\.(m?js)$/.test(name)) found.push(full);
  }
  return found;
}

/** Sizes for each script: raw bytes and gzip bytes (maximum compression). */
export function measure(dir) {
  return findScripts(dir).map((file) => {
    const data = readFileSync(file);
    return {
      file: relative(dir, file).split('\\').join('/'),
      raw: data.length,
      gzip: gzipSync(data, { level: 9 }).length,
    };
  });
}

const kb = (bytes) => (bytes / KB).toFixed(1).padStart(7);

function main() {
  const dist = resolve(process.argv[2] ?? 'dist');
  let sizes;
  try {
    sizes = measure(dist);
  } catch {
    console.error(`Cannot read ${dist}. Run "pnpm run build" first.`);
    process.exit(1);
  }
  if (sizes.length === 0) {
    console.error(`No JavaScript found in ${dist}. Is this the build folder?`);
    process.exit(1);
  }

  sizes.sort((a, b) => b.gzip - a.gzip);
  const total = sizes.reduce((sum, item) => sum + item.gzip, 0);

  console.log(`Largest first-party JS files in ${dist} (KB, gzip / raw):`);
  for (const item of sizes.slice(0, 10)) {
    console.log(`  ${kb(item.gzip)} / ${kb(item.raw)}  ${item.file}`);
  }
  console.log(
    `Total: ${(total / KB).toFixed(1)} KB gzip across ${sizes.length} files (budget ${BUDGET_KB} KB).`,
  );

  if (total > BUDGET_KB * KB) {
    const over = ((total - BUDGET_KB * KB) / KB).toFixed(1);
    console.error(`FAIL: ${over} KB over the budget. Look at the largest files above.`);
    process.exit(1);
  }
  console.log('OK: within budget.');
}

// Run only when started from the command line, so tests can import the helpers.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}

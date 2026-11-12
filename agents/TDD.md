> **Doc Info** — Last updated: 2026-11-12 · Reason: Switched package manager from npm to pnpm

# TDD — Roomtally Tech Design Document

Project type: **frontend-only static site** (no backend, no database, no accounts). Sections that normally describe servers are marked **N/A** with the reason, so no agent invents a backend.

## A. Tech Stack

### A.1 Stack Overview
- **Astro 7** static site generator: zero JS by default, fast pages, built-in sitemap and content collections.
- **TypeScript 6.0.3** (strict): safer calculation code. Pinned below 7 on purpose (see A.6).
- **Tailwind CSS 4** via the Vite plugin: CSS-first design tokens, small output.
- **vanilla-cookieconsent 3**: MIT consent banner with Google Consent Mode support.
- **Vitest + jsdom** unit tests, **Playwright** end-to-end tests, **Prettier** formatting.
- **Cloudflare Pages** hosting (free tier, global CDN) deployed with **Wrangler**.
- **Node 22.23.4** (Astro 7 requires Node ≥ 22.23.4).
- **pnpm 12.15.0** package manager, pinned in `packageManager`; `pnpm-lock.yaml` is the only lockfile.
Versions verified against the npm registry on 2026-11-08 (`pnpm view <pkg> version`, plus `engines` and `peerDependencies`).

### A.2 Core Dependencies
| Package | Version (exact pin) | Purpose | Install command |
|---|---|---|---|
| astro | 7.4.7 | framework and build | `pnpm add --save-exact astro@7.4.7` |
| @astrojs/sitemap | 3.7.4 | sitemap-index.xml generation | `pnpm add --save-exact @astrojs/sitemap@3.7.4` |
| @astrojs/markdown-remark | 7.3.6 | Markdown for guides (optional peer of Astro 7; install it) | `pnpm add --save-exact @astrojs/markdown-remark@7.3.6` |
| tailwindcss | 4.3.5 | utility CSS and tokens | `pnpm add --save-exact tailwindcss@4.3.5` |
| @tailwindcss/vite | 4.3.5 | Tailwind Vite plugin (peer vite ^8 satisfied by Astro's vite ^8.3.5) | `pnpm add --save-exact @tailwindcss/vite@4.3.5` |
| vanilla-cookieconsent | 3.3.0 | consent banner + preference centre | `pnpm add --save-exact vanilla-cookieconsent@3.3.0` |
| @fontsource-variable/fraunces | 5.3.0 | heading font, self-hosted | `pnpm add --save-exact @fontsource-variable/fraunces@5.3.0` |
| @fontsource-variable/inter | 5.3.0 | body font, self-hosted | `pnpm add --save-exact @fontsource-variable/inter@5.3.0` |

### A.3 Dev Dependencies
| Package | Version (exact pin) | Purpose | Install command |
|---|---|---|---|
| typescript | 6.0.3 | type checking (**not 7.0.2**) | `pnpm add -D --save-exact typescript@6.0.3` |
| @astrojs/check | 0.9.12 | `astro check` diagnostics (peer: TypeScript ^5 or ^6) | `pnpm add -D --save-exact @astrojs/check@0.9.12` |
| @types/node | 22.20.5 | Node types matching the Node 22 line | `pnpm add -D --save-exact @types/node@22.20.5` |
| vitest | 5.1.0 | unit tests | `pnpm add -D --save-exact vitest@5.1.0` |
| @vitest/coverage-v8 | 5.1.0 | coverage (must equal Vitest's version) | `pnpm add -D --save-exact @vitest/coverage-v8@5.1.0` |
| jsdom | 31.0.0 | DOM for UI unit tests | `pnpm add -D --save-exact jsdom@31.0.0` |
| @playwright/test | 1.65.0 | E2E tests | `pnpm add -D --save-exact @playwright/test@1.65.0` |
| prettier | 3.9.10 | formatting | `pnpm add -D --save-exact prettier@3.9.10` |
| prettier-plugin-astro | 1.1.2 | Prettier support for .astro | `pnpm add -D --save-exact prettier-plugin-astro@1.1.2` |
| wrangler | 4.158.0 | Cloudflare Pages deploy | `pnpm add -D --save-exact wrangler@4.158.0` |

### A.4 Full Install Commands
```bash
nvm install 22.23.4 && nvm use 22.23.4
corepack enable
pnpm init
pnpm add --save-exact astro@7.4.7 @astrojs/sitemap@3.7.4 @astrojs/markdown-remark@7.3.6 tailwindcss@4.3.5 @tailwindcss/vite@4.3.5 vanilla-cookieconsent@3.3.0 @fontsource-variable/fraunces@5.3.0 @fontsource-variable/inter@5.3.0
pnpm add -D --save-exact typescript@6.0.3 @astrojs/check@0.9.12 @types/node@22.20.5 vitest@5.1.0 @vitest/coverage-v8@5.1.0 jsdom@31.0.0 @playwright/test@1.65.0 prettier@3.9.10 prettier-plugin-astro@1.1.2 wrangler@4.158.0
pnpm exec playwright install --with-deps chromium
```
Set `"packageManager": "pnpm@12.15.0"` in package.json. pnpm scripts (names fixed): `dev` (astro dev), `build` (astro build), `preview` (astro preview), `check` (astro check), `test` (vitest run), `test:cov` (vitest run --coverage), `test:e2e` (playwright test), `format` (prettier --write .), `format:check` (prettier --check .), `size` (node scripts/check-bundle-size.mjs), `seo:check` (node scripts/check-seo.mjs).

### A.5 Environment Variables
| Variable | Required? | Description | Example |
|---|---|---|---|
| PUBLIC_SITE_URL | yes | canonical origin, no trailing slash | https://roomtally.example |
| PUBLIC_ADS_ENABLED | no (default false) | master switch for ads | false |
| PUBLIC_ADSENSE_CLIENT | when ads on | AdSense publisher ID | ca-pub-0000000000000000 |
| PUBLIC_ADSENSE_SLOT_INARTICLE | when ads on | ad unit ID for in-content units | 0000000000 |
| PUBLIC_ADSENSE_SLOT_BOTTOM | when ads on | ad unit ID for bottom units | 0000000000 |
| PUBLIC_AFFILIATES_ENABLED | no (default false) | master switch for affiliate links | false |
| PUBLIC_AFFILIATE_TAG_AMAZON_US / _UK / _CA / _AU | when affiliates on | affiliate tag per region | example-20 |
| PUBLIC_ANALYTICS_ENABLED | no (default false) | enables custom event wrapper (still needs consent) | false |
| PUBLIC_CF_BEACON_TOKEN | no | Cloudflare Web Analytics token | token-string |
| CLOUDFLARE_API_TOKEN | CI only | deploy token (GitHub secret) | — |
| CLOUDFLARE_ACCOUNT_ID | CI only | Cloudflare account (GitHub secret) | — |
Every `PUBLIC_` variable is readable by every visitor. Never put a secret in one.

### A.6 Version Conflict Notes
- **TypeScript 7.0.2 is the newest on the npm registry, but @astrojs/check 0.9.12 accepts only TypeScript ^5 or ^6.** Pin 6.0.3. Do not "upgrade to latest".
- Astro 7.4.7 needs Node ≥ 22.23.4; Vitest 5.1.0 needs Node ^22.12 / ^24 / ≥26; jsdom 31.0.0 needs ^22.22.2 / ^24.15 / ≥26. Node 22.23.4 satisfies all.
- pnpm 12.15.0 needs Node ≥ 18; Node 22.23.4 satisfies it. pnpm does not run dependency build scripts by default. If install reports blocked scripts, run `pnpm approve-builds` and allow only the named packages.
- @tailwindcss/vite 4.3.5 and Vitest 5.1.0 both accept Vite 8; Astro bundles Vite ^8.3.5. Do not install a separate Vite.
- @astrojs/markdown-remark is an optional peer of Astro 7; installed explicitly. ⚠ VERIFY: if the build still reports a missing Markdown package, read the error and install exactly what it names.

### A.7 Upgrade Notes
TypeScript is one major behind (7.x current). No breaking change affects this project today; revisit only when @astrojs/check lists TypeScript 7 as a peer. All other pins are the current stable on 2026-11-08.

## B. Backend Architecture

### B.8 Architecture Overview
No backend. Request lifecycle: browser → Cloudflare Pages edge (static file + `public/_headers`) → HTML/CSS/JS → page script → store → validation → calculators → renderer.

**Pattern: Room → Results pipeline**
Implemented in: `src/lib/ui/bindRoomForm.ts` → `bindRoomForm`
Behaviour: 1) read form values and convert to metres (`units.ts`); 2) validate with `validation.ts`; on failure show field errors and stop; 3) save to `projectStore.ts`; 4) `buildShoppingList` in `shoppingList.ts` runs every enabled calculator per room; 5) sum needs across rooms, round up once (`packSizes.ts`); 6) `renderShoppingList` in `renderResults.ts` draws buy quantity, exact need, assumptions, optional cost.
Inputs / outputs: form values in; DOM results out; raises CalcValidationError internally, caught and shown as field messages.
Must never: show a result after a failed validation (NV4); round per room before summing.

### B.9 Service Layer
| Function | File | Inputs | Returns | Errors | Rule |
|---|---|---|---|---|---|
| validateRoomInput | validation.ts | Room | void | CALC_001, CALC_007 | 7–8 |
| validateOpenings | validation.ts | Room | void | CALC_002, CALC_008 | 7–8 |
| validatePaintOptions | validation.ts | PaintOptions | void | CALC_004 | 7 |
| validateWaste | validation.ts | number | void | CALC_005 | 7 |
| validatePrice | validation.ts | number | void | CALC_006 | 7 |
| floorArea / ceilingArea / grossWallArea / openingsArea | geometry.ts | Room | number (m²) | — | 1 |
| netWallArea | geometry.ts | Room | number (m²) | CALC_002 if ≤ 0 | 1 |
| choosePacks | packSizes.ts | required quantity, pack sizes[] | PackResult (packs, totalQuantity, exactNeed) | — | 3 |
| calculatePaint | paint.ts | Room, PaintOptions | PaintResult (wall, ceiling?, primer?) | — | 3–5 |
| calculateFlooring | flooring.ts | Room, FlooringOptions | MaterialResult | — | 3–5 |
| calculateTile | tile.ts | Room, TileOptions | MaterialResult | — | 3–5 |
| calculateWallpaper | wallpaper.ts | Room, WallpaperOptions | MaterialResult | — | 3–5 |
| estimateCost | cost.ts | MaterialResult, price, region | CostEstimate or null | — | 6 |
| buildShoppingList | shoppingList.ts | Project | ShoppingList | — | 1, 3, 16 |
| addRoom / updateRoom / removeRoom / clearMyData | projectStore.ts | Room / id | void | CALC_003 on add past 10 | 7, 9 |
| readProject / writeProject / clearProject | storage.ts | — / Project | Project / void | STO_001, STO_002 handled internally | 9 |
| initConsent / openPreferences | consent.ts | — | void | CNS_001 logged | 13–14 |
| loadAds | ads.ts | — | void | ADS_001 logged | 12–13 |
| track | analytics.ts | event name, props | void (no-op unless allowed) | — | PRD §7 |

### B.10 URL / Route Map
| Method | Path | Auth | Handler | Request | Response |
|---|---|---|---|---|---|
| GET | / | none | `src/pages/index.astro` | — | HTML |
| GET | /paint-calculator/ | none | `src/pages/paint-calculator/index.astro` | — | HTML |
| GET | /paint-calculator/bedroom/ | none | `src/pages/paint-calculator/[room].astro` | — | HTML |
| GET | /paint-calculator/living-room/ | none | same | — | HTML |
| GET | /paint-calculator/kitchen/ | none | same | — | HTML |
| GET | /paint-calculator/bathroom/ | none | same | — | HTML |
| GET | /flooring-calculator/ | none | `src/pages/flooring-calculator/index.astro` | — | HTML |
| GET | /tile-calculator/ | none | `src/pages/tile-calculator/index.astro` | — | HTML |
| GET | /wallpaper-calculator/ | none | `src/pages/wallpaper-calculator/index.astro` | — | HTML |
| GET | /guides/ | none | `src/pages/guides/index.astro` | — | HTML |
| GET | /guides/how-much-paint-for-a-room/ | none | `src/pages/guides/[slug].astro` | — | HTML |
| GET | /guides/flooring-waste-factor/ | none | same | — | HTML |
| GET | /guides/how-to-measure-a-room/ | none | same | — | HTML |
| GET | /guides/tile-layout-and-waste/ | none | same | — | HTML |
| GET | /about/, /privacy/, /cookies/, /terms/, /disclaimer/ | none | `src/pages/about.astro`, `privacy.astro`, `cookies.astro`, `terms.astro`, `disclaimer.astro` | — | HTML |
| GET | any unknown path | none | `src/pages/404.astro` | — | HTML, status 404 |
| GET | /sitemap-index.xml (and sitemap-0.xml) | none | generated by `@astrojs/sitemap` | — | XML |
| GET | /robots.txt | none | `public/robots.txt` | — | text |
| GET | /ads.txt | none | `public/ads.txt` | — | text |

### B.11 API Endpoints
None. The site has no API and makes no runtime network calls except to the ad host and Cloudflare analytics, and only after consent.

### B.12 Middleware Stack
No server middleware. Edge behaviour comes only from `public/_headers` (security and cache headers, see D.31 and F.40).

### B.13 Background Jobs
None at runtime. Scheduled work lives in CI: weekly `pnpm audit` and Dependabot PRs (Engineering_Plan §B).

### B.14 Backend Coding Conventions
- Files: kebab-case for pages, camelCase for TS modules, PascalCase for `.astro` components. Functions camelCase, types PascalCase, constants UPPER_SNAKE.
- Calculation code is **pure**: no DOM, no storage, no globals. Everything in `src/lib/calc/` is testable in Node.
- Imports: types, then libraries, then project modules; no default exports in `src/lib`.
- **Never do:** `innerHTML` with any data; read `window` inside `src/lib/calc`; round before the final sum; hard-code a coverage or waste number outside `src/data/materials.ts`; add a dependency without an exact pin and a note here.
- Git: branches `feat/…`, `fix/…`, `docs/…`; Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

## C. Frontend Architecture

### C.15 Architecture Overview
Static site generation (SSG) for every page: best speed and SEO. Interactivity is plain TypeScript modules loaded by page scripts, no UI framework. Tree (all paths are in File_Map.md):
```
src/ config/ data/ lib/{calc,state,ui,seo}/ components/{layout,common,room,results,ads,calculators}/
     layouts/ pages/ content/guides/ styles/ types/
public/   tests/{unit,e2e,helpers}/   scripts/   .github/workflows/   agents/
```

### C.16 State Management Pattern
**Pattern: Single project store**
Implemented in: `src/lib/state/projectStore.ts`
Behaviour: 1) on load, read via `storage.ts` (validated); 2) expose getters and mutators; 3) every mutator validates, updates memory, persists (debounced 300 ms), then notifies subscribers; 4) UI scripts subscribe and re-render.
Must never: let UI code write to localStorage directly.
Global state = the Project. Local state = unsaved form text. Server state = none.

### C.17 Data Fetching Pattern
None at runtime. Static data is imported from `src/data/`. Loading state: none needed (calculation is synchronous). Empty state: results show a "Enter a room to see your list" message. Error state: field-level messages (G).

### C.18 Routing Conventions
File-based routing in `src/pages/`. Trailing slash always. Dynamic routes only through `getStaticPaths` (`[room].astro`, `[slug].astro`). No protected routes.

### C.19 Form Handling Pattern
**Pattern: Validate-on-change, show-on-blur**
Implemented in: `src/lib/ui/bindRoomForm.ts`
Behaviour: 1) parse inputs on every change; 2) run validation; 3) mark field errors visible after blur or submit; 4) valid values update the store and results immediately; 5) invalid values leave previous results hidden (NV4).
Validation library: none; our own `validation.ts` (no dependency needed).

### C.20 Frontend Error Handling
**Pattern: Global error surface**
Implemented in: `src/lib/ui/dom.ts` → `installGlobalErrorHandler`
Behaviour: 1) listen for `error` and `unhandledrejection`; 2) log a short coded message to the console; 3) show one friendly banner "Something went wrong. Your saved rooms are safe."; 4) never show a stack trace.
Must never: show raw error text from storage, consent or ad code.

### C.21 Frontend Code Conventions
Components: PascalCase `.astro`; no logic beyond props and markup. UI scripts: one exported `bind…` or `init…` function per file. Accessibility attributes on every control. **Never do:** inline event-handler attributes; `any` type; skipping `aria-live` on results.

### C.22 Build & Toolchain
`pnpm run build` = `astro build` (outputs `dist/`). Env vars read by Astro at build via `import.meta.env`. Output must be fully static. Fonts imported from the two Fontsource packages (latin subset only).

## D. Security

### D.23 Authentication Strategy
N/A: no accounts, sessions or tokens.

### D.24 Authorisation Rules
| Role | Can | Cannot |
|---|---|---|
| Visitor (only role) | read pages, use calculators, store data in own browser | anything server-side (there is none) |

### D.25 Tenant Isolation Pattern
N/A (no tenants). The stored-data tamper pattern is in Backend_Schema §4.

### D.26 Input Validation Strategy
Client-side only (nothing to validate server-side). Validation in `src/lib/calc/validation.ts` for every number; text (room name) limited to 40 characters and only ever rendered with `textContent` through `src/lib/ui/dom.ts`. Stored data is re-validated on read (Backend_Schema §4).

### D.27 Rate Limiting
N/A at app level. Cloudflare's network protections apply to the static origin.

### D.28 Webhook Verification
N/A: no webhooks.

### D.29 Secrets Management
No runtime secrets exist. The only secrets are `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, held as GitHub Actions secrets and injected only in `.github/workflows/deploy.yml`. Rotate the token every 90 days and after any suspected leak. Never commit `.env`.

### D.30 CORS Policy
No API, so no CORS configuration. The site sends no `Access-Control-Allow-Origin` header.

### D.31 Security Headers
Set in `public/_headers` for all paths.
| Header | Value |
|---|---|
| Strict-Transport-Security | max-age=31536000; includeSubDomains |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | SAMEORIGIN |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), payment=() |
| Cross-Origin-Opener-Policy | same-origin |
| Content-Security-Policy | default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://www.google.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://pagead2.googlesyndication.com https://cloudflareinsights.com; frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none' |
⚠ VERIFY the ad-host list against Google's current AdSense CSP guidance and test with ads enabled before launch. `'unsafe-inline'` for scripts is a launch compromise (the theme and consent init need inline code); tighten with hashes after ads are approved.

### D.32 Data Encryption
In transit: HTTPS via Cloudflare (TLS 1.2+ enforced by Cloudflare defaults). At rest: browser localStorage is unencrypted; it holds only room sizes and optional prices, nothing sensitive.

### D.33 Vulnerability Scanning
`pnpm audit --prod --audit-level=high` in CI on every PR and weekly; Dependabot weekly. Response: High/Critical in production dependencies fixed or pinned around within 7 days.

## E. Penetration Test Scenarios

### E.34 Threat Model Overview
Assets: visitor trust and privacy, site reputation and AdSense account, affiliate revenue integrity, build pipeline. Attackers: unauthenticated visitor (only profile), malicious browser extension or tampered localStorage on the visitor's own device, supply-chain attacker (npm registry), third-party ad content.

### E.35 Attack Scenarios

### Attack: DOM XSS through the room name
**OWASP Category / CVE Class:** A03 Injection (XSS)
**Target:** `src/lib/ui/renderResults.ts`, room list rendering
**Reproduction Steps:**
1. Enter a room name containing script or markup.
2. Save and reload so it renders from storage.
**Impact:** script runs in the site's origin (could abuse consent or ad scripts).
**Fix:** render every user string only with `textContent` through `dom.ts`; `innerHTML` must not exist in `src/`.
**Verification:** `pnpm exec vitest run tests/unit/renderResults.test.ts` and `! grep -rn "innerHTML" src/`

### Attack: Tampered localStorage (over-posting / bad numbers)
**OWASP Category / CVE Class:** A08 Software and Data Integrity Failures
**Target:** `src/lib/state/storage.ts` → `readProject`
**Reproduction Steps:**
1. In dev tools set the project key to JSON with negative sizes, NaN, huge strings, or 10,000 rooms.
2. Reload.
**Impact:** crash, nonsense "buy" numbers, frozen page.
**Fix:** `readProject` must validate every field with `validation.ts` and reset on failure (STO_002).
**Verification:** `pnpm exec vitest run tests/unit/storage.test.ts`

### Attack: Consent bypass (scripts before consent)
**OWASP Category / CVE Class:** A05 Security Misconfiguration (privacy)
**Target:** `src/lib/ui/ads.ts`, `src/lib/ui/analytics.ts`, `BaseLayout.astro`
**Reproduction Steps:**
1. Load a page with a clean profile and watch network requests.
2. Look for requests to ad or analytics hosts before any consent click.
**Impact:** legal exposure, AdSense policy issue.
**Fix:** no ad or analytics `<script>` tag may exist in markup; only `loadAds` injects it after consent.
**Verification:** `pnpm exec playwright test tests/e2e/consent.spec.ts` and `pnpm exec vitest run tests/unit/ads-consent.test.ts`

### Attack: Supply-chain compromise via the npm registry
**OWASP Category / CVE Class:** A06 Vulnerable and Outdated Components / A08
**Target:** `package.json`, `pnpm-lock.yaml`, CI
**Reproduction Steps:**
1. A dependency publishes a malicious patch version.
2. A loose version range pulls it in.
**Impact:** malicious code on every visitor's browser.
**Fix:** exact pins, `pnpm install --frozen-lockfile` in CI, Dependabot PRs reviewed manually, versions younger than 14 days avoided for new additions.
**Verification:** `pnpm install --frozen-lockfile && pnpm audit --prod --audit-level=high`

### Attack: Clickjacking
**OWASP Category / CVE Class:** A05 Security Misconfiguration
**Target:** all pages
**Reproduction Steps:** embed the site in a hostile page's iframe and overlay buttons.
**Impact:** accidental ad or affiliate clicks (policy violation).
**Fix:** `X-Frame-Options: SAMEORIGIN` and `frame-ancestors 'self'` in `public/_headers`.
**Verification:** `curl -sI http://localhost:4321/ | grep -i frame` against `astro preview` plus Cloudflare headers check after deploy: `curl -sI $PUBLIC_SITE_URL/ | grep -i -E "frame|content-security"`

### Attack: Affiliate link tampering / open redirect
**OWASP Category / CVE Class:** A01 Broken Access Control / unvalidated redirect
**Target:** `src/data/affiliates.ts`, `src/components/ads/AffiliateLink.astro`
**Reproduction Steps:** try to make a link point elsewhere via URL parameters or stored data.
**Impact:** visitors sent to a hostile site.
**Fix:** link URLs come only from the static partner table plus the env tag; no URL, query or storage value is ever used to build a link.
**Verification:** `pnpm exec playwright test tests/e2e/calculators.spec.ts` (asserts link hosts equal the table) and review of `AffiliateLink.astro`.

### Attack: Secret leakage through the bundle or errors
**OWASP Category / CVE Class:** A02 Cryptographic Failures / information exposure
**Target:** `.env.example`, build output, console messages
**Reproduction Steps:** search `dist/` for token names; trigger errors and read the console.
**Impact:** Cloudflare token exposure.
**Fix:** only `PUBLIC_` variables are read in `src/`; error messages contain codes, never values.
**Verification:** `pnpm run build && ! grep -rn "CLOUDFLARE_API_TOKEN" dist/`

### Attack: Over-broad CSP lets third-party content inject script
**OWASP Category / CVE Class:** A05 Security Misconfiguration
**Target:** `public/_headers`
**Reproduction Steps:** review the CSP for wildcard script hosts and `'unsafe-inline'`.
**Impact:** an ad-network compromise reaches first-party context.
**Fix:** keep the host list minimal; move to hashes post-launch; keep `object-src 'none'`.
**Verification:** run the page through a CSP evaluator manually before launch.

**Not applicable here (no server, accounts, database, uploads, webhooks):** cross-tenant data leak, auth bypass/token forgery, SQL/NoSQL injection, rate-limit bypass, IDOR on media, privilege escalation, webhook replay.

### E.36 Dependency Vulnerability Scan
`pnpm audit --prod --audit-level=high`; triage: fix by upgrading to a patched exact pin, otherwise document the exception here.

### E.37 Prioritised Remediation Checklist
| Severity | Issue | Fix reference |
|---|---|---|
| High | Scripts before consent | Attack: Consent bypass |
| High | Supply-chain pins | Attack: Supply-chain |
| Medium | `'unsafe-inline'` in CSP | D.31, Attack: Over-broad CSP |
| Medium | Tampered storage | Attack: Tampered localStorage |
| Medium | XSS via room name | Attack: DOM XSS |
| Low | Clickjacking, affiliate tampering, secrets in bundle | their scenarios |

### E.38 Pre-Launch Penetration Testing Notes
Manual: OWASP ZAP baseline scan against the preview URL; browser dev-tools network check with a clean profile; a CSP evaluator; keyboard-only run-through.

## F. Performance & Scalability

### F.39 Performance Goals
Static files on a CDN. Targets (75th percentile, mobile 4G): LCP ≤ 2.0 s, INP ≤ 150 ms, CLS ≤ 0.05; Lighthouse performance ≥ 95; TTFB ≤ 200 ms from the edge; error rate under load 0% (static). Throughput is the CDN's concern; no origin to saturate.

### F.40 Caching Strategy
| Layer | What | Key | TTL | Invalidation |
|---|---|---|---|---|
| DB / API | N/A | — | — | — |
| CDN edge | HTML | path | `Cache-Control: public, max-age=0, must-revalidate` | each deploy |
| CDN edge | `/_astro/*` hashed assets and fonts | path with hash | `public, max-age=31536000, immutable` | new hash per build |
| Client | localStorage project | `roomtally:project:v1` | until cleared | Clear my data / schema reset |

### F.41 Database Performance
N/A (no database). N+1 rule translates to: never recompute all rooms on every keystroke of one room; `buildShoppingList` runs once per valid change, debounced 300 ms.

### F.42 Horizontal Scaling Strategy
Cloudflare's global network serves static files; nothing to scale. Deploy with `pnpm exec wrangler pages deploy dist --project-name=roomtally`.

### F.43 Load Testing
Not needed for static hosting. Instead run budget checks: `pnpm run size` and the Lighthouse run in PageSpeed Insights against the preview URL before each release.

### F.44 Monitoring & Alerting
Cloudflare Web Analytics for Core Web Vitals and traffic (no cookies). Any free external uptime monitor on `/` with email alerts. Alert thresholds: down for 5 minutes; LCP p75 above 2.5 s for 3 days.

### F.45 Degradation & Failover
| Failure | Behaviour |
|---|---|
| Ad script blocked or fails | ad container stays empty at its reserved height (ADS_001 logged) |
| Consent library fails | non-essential features stay off (CNS_001) |
| localStorage unavailable | app works from memory with an info note (STO_001) |
| JavaScript disabled | content readable; calculators show a notice |
Circuit breaker: not applicable.

### F.46 Asset Optimisation
Fonts: self-hosted variable fonts, latin subset, `font-display: swap`, preload the two used files. Images: only favicons and one OG image (no in-page photos in v1). Bundle budget: ≤ 60 KB gzip of first-party JS, enforced by `scripts/check-bundle-size.mjs` in CI. Ad containers have fixed `min-height` to avoid layout shift.

## G. Error Handling

### G.47 Error Philosophy
Fail visible and friendly at the field; fail silent for third parties (ads, consent library, analytics). Never block the calculator because something optional broke.

### G.48 Error Taxonomy
| Class | HTTP-equivalent | Code | User-facing message | Developer message |
|---|---|---|---|---|
| Validation | 422 (client-side only) | CALC_001 | "That size looks off. Check it is between {min} and {max}." | dimension out of range |
| Validation | 422 | CALC_002 | "The doors and windows are bigger than the walls." | openings area ≥ wall area |
| BusinessRule | 422 | CALC_003 | "You can add up to 10 rooms." | room limit reached |
| Validation | 422 | CALC_004 | "Choose 1 to 4 coats." | coats out of range |
| Validation | 422 | CALC_005 | "Waste can be 0 to 30%." | waste out of range |
| Validation | 422 | CALC_006 | "Enter a price between 0 and 100,000." | price out of range |
| Validation | 422 | CALC_007 | "Enter a number." | empty or NaN |
| Validation | 422 | CALC_008 | "You can add up to 20 doors and windows." | openings count > 20 |
| Infrastructure | n/a | STO_001 | "We can't save in this browser, so your rooms will be lost when you leave." | localStorage unavailable |
| Infrastructure | n/a | STO_002 | "We reset your saved rooms because they could not be read." | stored data invalid or unknown version |
| Infrastructure | n/a | CNS_001 | (silent) | consent library failed |
| Infrastructure | n/a | ADS_001 | (silent) | ad script failed or blocked |
| NotFound | 404 | NAV_404 | "We couldn't find that page." | unknown route |
Authentication, Authorization and RateLimit classes: not applicable.

### G.49 Global Error Handler
**Pattern: Global error surface**
Implemented in: `src/lib/ui/dom.ts` → `installGlobalErrorHandler` (see C.20). It catches uncaught errors and rejections, logs a coded one-line message, shows one friendly banner, and never exposes stack traces.

### G.50 Validation Error Shape
| Field | Meaning |
|---|---|
| code | error code from G.48 |
| field | input name that failed (e.g. lengthM) |
| message | the user-facing text with limits filled in |

### G.51 Error Logging Rules
Console only, one line, code plus field name. Never log room names, prices or stored JSON.

### G.52 Client-Side Error Handling Pattern
Field errors via `bindRoomForm.ts` (C.19); global errors via `dom.ts` (C.20).

### G.53 Error Monitoring Integration
None in v1 (no Sentry, to avoid another third-party script). Revisit if bugs are hard to reproduce; any addition needs consent handling.

### G.54 "Never Expose" List
Stack traces, raw stored JSON, environment values, ad-network error bodies.

## H. Technical SEO

### H.55 SEO Priority Assessment
B2C, organic search is the main channel. Highest priority: calculator pages and room-type pages, then guides, then home.

### H.56 Meta Tag Strategy
| Page type | Title pattern (≤ 60 chars) | Description pattern (≤ 155 chars) |
|---|---|---|
| Home | Roomtally: Paint, Flooring & Tile Calculator in One List | Enter your room once to get a shopping list for paint, flooring, tile and wallpaper, rounded to real pack sizes. |
| Calculator | {Material} Calculator: How Much Do I Need? \| Roomtally | one sentence on what it calculates plus the assumption shown |
| Room type | {Room} Paint Calculator: How Much Paint? \| Roomtally | typical room size and result sentence |
| Guide | {Guide title} \| Roomtally | one-sentence summary |
| Legal | {Page} \| Roomtally | one-sentence purpose |
All pages: Open Graph title, description, URL and image (`public/og-default.png`), Twitter card `summary_large_image`.

### H.57 Sitemap Configuration
Auto-generated by `@astrojs/sitemap` into `sitemap-index.xml`; excludes `/404`. Updated every build.

### H.58 Robots.txt Rules
Allow all; list `Sitemap: {PUBLIC_SITE_URL}/sitemap-index.xml`. No blocked paths.

### H.59 Structured Data / Schema.org
| Page type | Types | Emitted by |
|---|---|---|
| Home | WebSite, WebApplication, FAQPage | `src/lib/seo/schema.ts` via `Seo.astro` |
| Calculator and room-type pages | WebApplication, FAQPage, BreadcrumbList | same |
| Guides | Article, BreadcrumbList, FAQPage (when FAQs exist) | same |
| Legal pages, about | BreadcrumbList | same |
| 404 | none | — |

### H.60 Core Web Vitals Strategy
LCP: no hero image, text-first hero, preloaded fonts. CLS: reserved ad heights, font fallback metrics, explicit sizes. INP: small scripts, no framework, work only on valid change (debounced).

### H.61 Canonical URL Strategy
Absolute canonical on every page: `{PUBLIC_SITE_URL}{path}` with trailing slash; no query parameters are indexed (the site uses none).

### H.62 Mobile & Device Readiness
Breakpoints 640, 768, 1024, 1280 px; touch targets ≥ 44 px; viewport meta set; numeric inputs use the numeric keypad; PWA not in v1.

### H.63 Internationalisation
English only. Region setting changes units, currency and wording on the same URLs; no hreflang in v1 (⚠ revisit if separate UK/AU pages are added).

## I. Reference Repos

| Repo | URL | License | Why it's relevant | Paths worth studying | Use |
|------|-----|---------|-------------------|----------------------|-----|
| onwidget/astrowind | https://github.com/onwidget/astrowind | MIT | Astro 7 + Tailwind CSS 4 theme with dark mode and SEO setup; also published as arthelokyo/astrowind | `src/config.yaml`, `src/components/CustomStyles.astro`, `src/assets/styles/tailwind.css`, `src/layouts/PageLayout.astro`, `src/pages/index.astro` | adapt |
| orestbida/cookieconsent | https://github.com/orestbida/cookieconsent | MIT | Consent banner and preference centre; documents Google Consent Mode integration (docs at cookieconsent.orestbida.com) | documentation site (Consent Mode section); installed from the npm registry as vanilla-cookieconsent | copy |
| stoffis-git/construction-utils | https://github.com/stoffis-git/construction-utils | MIT | Construction formula helpers (paint gallons, primer, flooring sq ft, tile boxes, drywall sheets) to cross-check our formulas | README Quick Start function list (repo file layout not verified) | idea-only |

No verified reference for security/error handling or test setups; write from the spec.

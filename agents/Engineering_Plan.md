> **Doc Info** — Last updated: 2026-11-12 · Reason: Switched package manager from npm to pnpm

# Engineering_Plan — Roomtally (bonus)

## A. Testing Strategy

### A.1 Overview
Split: about 70% unit (calculation, validation, storage, schema), 20% jsdom UI tests (renderer, consent/ads), 10% end-to-end. Moderate depth: every formula and every error code is tested; pages are covered by a few journeys, not by per-component tests.

### A.2 Framework & Toolchain
Vitest 5.1.0 with @vitest/coverage-v8 5.1.0 and jsdom 31.0.0 (config `vitest.config.ts`); Playwright @playwright/test 1.65.0 (config `playwright.config.ts`, Chromium desktop plus one mobile profile).

### A.3 Test File Conventions
Unit tests in `tests/unit/<module>.test.ts`; E2E in `tests/e2e/<flow>.spec.ts`; helpers in `tests/helpers/`. One `describe` per exported function; each `it` names the behaviour in plain words. Tests named "tampered" cover hostile storage data.

### A.4 Factory / Fixture Pattern
**Pattern: Room factories**
Implemented in: `tests/helpers/roomFixtures.ts`
Behaviour: 1) export a function that returns a valid room with sensible defaults; 2) accept overrides for any field; 3) export named variants (with openings, multi-room project, each invalid case).
Must never: share mutable objects between tests.

### A.5 Auth Testing Pattern
N/A (no accounts).

### A.6 Tamper Isolation Test Pattern (replaces tenant isolation)
**Pattern: Hostile storage**
Implemented in: `tests/helpers/storageMock.ts` and `tests/unit/storage.test.ts`
Behaviour: 1) inject a storage stand-in holding bad data (bad JSON, negative or NaN numbers, giant strings, 10,000 rooms, newer schema version); 2) call `readProject`; 3) assert the result is a valid empty project, the right error code is logged, and nothing throws.
Must never: let bad stored data reach a calculator.

### A.7 Route / Page Testing Pattern
**Pattern: Journey spec**
Implemented in: `tests/e2e/home-flow.spec.ts`, `tests/e2e/calculators.spec.ts`
Behaviour: 1) happy path with a known room and the expected result; 2) error path with an out-of-range value and the expected message and code; 3) boundary path at the exact limit.

### A.8 E2E Testing Strategy
Playwright runs against `astro preview` of the built site. Journeys: home flow (Journey 1), calculators (Journey 2), consent (Journey 3), SEO checks for every route. Command: `pnpm exec playwright test`.

### A.9 Coverage Targets
| Layer | Target |
|---|---|
| `src/lib/calc/**` unit | ≥ 95% lines |
| `src/lib/state/**` unit | ≥ 90% lines |
| `src/lib/ui/**` jsdom | ≥ 70% lines |
| Overall | ≥ 80% lines |
| E2E | 4 specs, all routes visited in the SEO spec |

### A.10 CI Test Commands
Unit: `pnpm run test:cov`. E2E: `pnpm exec playwright test`. Budget: `pnpm run size`. SEO: `pnpm run seo:check`.

## B. CI/CD Pipeline

### B.11 CI Platform
GitHub Actions. Files: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `.github/dependabot.yml`. CI installs pnpm 12.15.0 first (Corepack or `pnpm/action-setup`) and caches the pnpm store. ⚠ VERIFY the current major versions of `actions/checkout`, `actions/setup-node` and `pnpm/action-setup` before writing the workflows.

### B.12 Pipeline Stages
```bash
pnpm install --frozen-lockfile
pnpm run format:check
pnpm run check
pnpm run test:cov
pnpm run build
pnpm run size
pnpm run seo:check
pnpm audit --prod --audit-level=high
pnpm exec playwright install --with-deps chromium
pnpm exec playwright test
```

### B.13 Environment Strategy
Branches: `main` deploys to production; every other branch can deploy a Cloudflare Pages preview. No separate staging.

### B.14 Deployment Target + Deploy Commands
```bash
pnpm run build
pnpm exec wrangler pages deploy dist --project-name=roomtally
```
Preview: add `--branch=<branch-name>` (⚠ VERIFY flag in current Wrangler docs).

### B.15 Environment Variable Injection
Build-time `PUBLIC_*` variables are set in the Cloudflare Pages project settings and in the CI build step; `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are GitHub Actions secrets used only by `deploy.yml`. The Cloudflare Pages build command is `pnpm run build`, with `pnpm-lock.yaml` as the dependency lockfile.

### B.16 Database Migration Strategy (in pipeline)
N/A (no database). Browser-side migrations are covered by unit tests (`tests/unit/storage.test.ts`).

### B.17 Rollback Procedure
1) In the Cloudflare dashboard open the project's Deployments and roll back to the previous good deployment (⚠ VERIFY current dashboard wording; no Wrangler rollback command was verified). 2) Or run `git revert <bad-commit>` and push to main to redeploy. No data is lost because nothing is stored server-side.

### B.18 Preview / PR Environments
Cloudflare Pages preview deployments per branch, created by the deploy command with `--branch`; they are removed with the branch or by Cloudflare retention settings.

### B.19 Notification Strategy
GitHub emails the committer on any failed workflow. No chat alerts. Uptime monitor emails the owner when the site is down for 5 minutes.

## C. Quality Checklist

### Layer 0: Scaffold, tooling and docs
**Deliverables expected:** Docs placed; package.json with exact pins; configs for Astro, Vitest, Playwright, Wrangler.
**Gate checks:**
```bash
pnpm install --frozen-lockfile && pnpm exec prettier --check package.json tsconfig.json astro.config.ts
```
**Definition of done:** `pnpm install --frozen-lockfile` succeeds on Node 22.23.4 and configs parse.
**Agent audit items (human reviewer):** Are the pins exactly those in TDD §A? Is TypeScript 6.0.3?

### Layer 1: Types, config, data, errors
**Deliverables expected:** Types, error catalogue, site/feature config, presets for materials, regions, room types, affiliates.
**Gate checks:**
```bash
pnpm exec astro check
```
**Definition of done:** Type check passes; every value in PRD Rule 4 appears in materials.ts with a source note.
**Agent audit items (human reviewer):** Do preset values match PRD Rule 4? Are roll sizes flagged for verification?

### Layer 2: Calculation engine
**Deliverables expected:** Fixtures, units, validation, geometry, pack optimiser, four calculators, cost, shopping list, API entry.
**Gate checks:**
```bash
pnpm exec astro check && pnpm exec vitest run tests/unit --coverage
```
**Definition of done:** All unit tests pass; coverage for `src/lib/calc/**` ≥ 95%.
**Agent audit items (human reviewer):** Hand-calculate three rooms on paper and compare with test expectations; check rounding happens once, after the sum.

### Layer 3: State and storage
**Deliverables expected:** Storage test doubles, safe storage, migrations, project store.
**Gate checks:**
```bash
pnpm exec vitest run tests/unit/storage.test.ts tests/unit/projectStore.test.ts && pnpm exec vitest run tests/unit/storage.test.ts -t "tampered"
```
**Definition of done:** Corrupt, tampered and unavailable storage are handled; room limit 10 enforced; coverage for `src/lib/state/**` ≥ 90%.
**Agent audit items (human reviewer):** Try corrupting the stored key by hand in a browser.

### Layer 4: Design tokens, SEO helpers, shared browser modules
**Deliverables expected:** Tokens stylesheet, meta and schema builders, DOM helpers, unit toggle, analytics wrapper, consent manager, ads loader.
**Gate checks:**
```bash
pnpm exec astro check && pnpm exec vitest run tests/unit/schema.test.ts tests/unit/ads-consent.test.ts && pnpm run build
```
**Definition of done:** Build passes; no ad or analytics script injectable before consent (test proves it).
**Agent audit items (human reviewer):** Open the built site with a clean browser profile and watch the network tab before clicking the banner.

### Layer 5: Components
**Deliverables expected:** All 18 Astro components.
**Gate checks:**
```bash
pnpm exec astro check && pnpm run build
```
**Definition of done:** Every component matches its Design_Brief §B.13 props; no hard-coded colours.
**Agent audit items (human reviewer):** Does it look right in light and dark? Are focus rings visible? Do labels read clearly?

### Layer 6: Layouts
**Deliverables expected:** Base, guide and legal layouts.
**Gate checks:**
```bash
pnpm run build
```
**Definition of done:** Pages build; theme applied before first paint; legal layout has no ads.
**Agent audit items (human reviewer):** Reload in dark mode and watch for a flash of light theme.

### Layer 7: Form and results scripts
**Deliverables expected:** Results renderer, room form binding, print list.
**Gate checks:**
```bash
pnpm exec vitest run tests/unit/renderResults.test.ts && pnpm run build
```
**Definition of done:** Valid input renders results; invalid input shows messages and no results; markup in names renders as text.
**Agent audit items (human reviewer):** Use the form with keyboard only and a screen reader if possible.

### Layer 8: Pages
**Deliverables expected:** Home, calculator, room-type and 404 pages.
**Gate checks:**
```bash
pnpm run build && pnpm run seo:check
```
**Definition of done:** All routes in TDD §B.10 build; one h1 per page.
**Agent audit items (human reviewer):** Does each page answer its search question within the first screen?

### Layer 9: Content and legal pages
**Deliverables expected:** Content collection, four guides, guides pages, legal pages.
**Gate checks:**
```bash
pnpm run build && pnpm run seo:check
```
**Definition of done:** All guide and legal routes build; legal pages carry no ads.
**Agent audit items (human reviewer):** Read each guide: is it accurate, original and in the PRD voice? Have the legal pages been reviewed by a qualified person?

### Layer 10: Static assets and headers
**Deliverables expected:** Headers, robots, ads.txt, icons, share image.
**Gate checks:**
```bash
pnpm run build && test -s public/_headers && test -s public/robots.txt
```
**Definition of done:** Headers file matches TDD §D.31; icons exist at the sizes in Design_Brief §A.7.
**Agent audit items (human reviewer):** Check the CSP with ads enabled in a preview deploy.

### Layer 11: End-to-end tests and scripts
**Deliverables expected:** E2E specs, bundle-size and SEO scripts.
**Gate checks:**
```bash
pnpm run build && pnpm exec playwright test && pnpm run size && pnpm run seo:check
```
**Definition of done:** All E2E specs pass on desktop and mobile profiles; JS budget met.
**Agent audit items (human reviewer):** Run PageSpeed Insights on the preview URL: LCP, CLS, INP targets in TDD §F.39.

### Layer 12: CI/CD and README
**Deliverables expected:** CI, deploy workflow, Dependabot, README.
**Gate checks:**
```bash
pnpm exec prettier --check .github README.md
```
**Definition of done:** CI is green on a pull request; deploy runs only from main.
**Agent audit items (human reviewer):** Confirm the two Cloudflare secrets exist in GitHub and a preview deploy works.

## D. Reference Repos
None verified. No verified reference repo with a matching test or CI setup was found; write from the spec.

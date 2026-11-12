> **Doc Info** — Last updated: 2026-11-12 · Reason: Switched package manager from npm to pnpm

# Build_prompts — Roomtally

Work through the batches in order. Run each batch's gate checks; do not start the next batch until all pass. One unit per batch. No batch creates a file that is not in `agents/File_Map.md`.

## 1. Build Order Overview

| Layer | Contents | Batches |
|---|---|---|
| 0 | scaffold, tooling and docs | 1–3 |
| 1 | types, config, data, errors | 4–10 |
| 2 | calculation engine | 11–22 |
| 3 | state and storage | 23–25 |
| 4 | design tokens, SEO helpers and shared browser modules (dom, unit toggle, analytics, consent, ads) | 26–33 |
| 5 | components | 34–51 |
| 6 | layouts | 52–54 |
| 7 | form and results scripts | 55–57 |
| 8 | pages | 58–64 |
| 9 | content and legal pages | 65–75 |
| 10 | static assets and headers | 76–78 |
| 11 | end-to-end tests and scripts | 79–84 |
| 12 | CI/CD and README | 85–88 |

## 2. Batch Prompts

### Batch 1: Place the documentation suite  (Layer 0)
**Files to create:** `CLAUDE.md`, `AGENTS.md`, `agents/PRD.md`, `agents/TDD.md`, `agents/App_Flow.md`, `agents/Design_Brief.md`, `agents/Backend_Schema.md`, `agents/File_Map.md`, `agents/Build_prompts.md`, `agents/Engineering_Plan.md`
**Read first:** CLAUDE.md → Document Map, and each file's File_Map entry
**Reference:** none — copy the provided files into place
**Deliverables:**
1. Copy CLAUDE.md and AGENTS.md to the project root and the other eight files into agents/ unchanged.
**Gate checks (all must pass before the next batch):**
```bash
test -f CLAUDE.md && test -f AGENTS.md && test -f agents/PRD.md && test -f agents/TDD.md && test -f agents/App_Flow.md && test -f agents/Design_Brief.md && test -f agents/Backend_Schema.md && test -f agents/File_Map.md && test -f agents/Build_prompts.md && test -f agents/Engineering_Plan.md
pnpm dlx vitest@5.1.0 run --passWithNoTests
```

### Batch 2: Scaffold and dependency pins  (Layer 0)
**Files to create:** `package.json`, `pnpm-lock.yaml`, `.nvmrc`, `.gitignore`, `.prettierrc.json`, `.prettierignore`, `tsconfig.json`, `.env.example`
**Read first:** TDD → §A.1–A.7, §A.5 (env vars), and each file's File_Map entry
**Reference:** onwidget/astrowind (MIT; also published as arthelokyo/astrowind):package.json — adapt
**Deliverables:**
1. package.json with the exact pins from TDD §A.2–A.3, engines.node >=22.23.4, `"packageManager": "pnpm@12.15.0"` and the pnpm scripts named in TDD §A.4.
2. TypeScript pinned to 6.0.3 (not 7.x) because @astrojs/check 0.9.12 only accepts TypeScript 5 or 6.
3. All variables from TDD §A.5 in .env.example with safe example values; .nvmrc contains 22.23.4.
4. Run `pnpm install` to generate `pnpm-lock.yaml`; commit the lockfile.
**Gate checks (all must pass before the next batch):**
```bash
node -v
pnpm install --frozen-lockfile
pnpm exec prettier --check package.json tsconfig.json
pnpm exec vitest run --passWithNoTests
```

### Batch 3: Tool configuration  (Layer 0)
**Files to create:** `astro.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `wrangler.toml`
**Read first:** TDD → §C.15, §C.22, §H.57; Engineering_Plan → §A.2, and each file's File_Map entry
**Reference:** onwidget/astrowind (MIT; also published as arthelokyo/astrowind):astro.config.ts — idea-only
**Deliverables:**
1. astro.config.ts: static output, trailingSlash always, build format directory, site from PUBLIC_SITE_URL, sitemap integration, Tailwind Vite plugin.
2. vitest.config.ts: node default, jsdom for tests named *.dom or the two jsdom suites, V8 coverage with thresholds from Engineering_Plan §A.9.
3. playwright.config.ts: Chromium desktop and one mobile profile, webServer runs astro preview on the built site.
4. wrangler.toml: project name roomtally, pages_build_output_dir dist.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec prettier --check astro.config.ts vitest.config.ts playwright.config.ts
```

### Batch 4: Core types  (Layer 1)
**Files to create:** `src/types/project.ts`, `src/types/calc.ts`
**Read first:** Backend_Schema → §2; TDD → §B.9, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. project.ts: Project, Room, Opening, Settings and the SchemaVersion constant exactly as the Backend_Schema tables.
2. calc.ts: option types per material, per-room result, MaterialResult (buyQuantity, exactQuantity, unit, packBreakdown) and ShoppingList.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 5: Error catalogue  (Layer 1)
**Files to create:** `src/lib/calc/errors.ts`
**Read first:** TDD → §G.48–G.50, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Every code from TDD §G.48 as a typed constant with user message and developer message.
2. CalcValidationError carrying code, field and message; no stack traces ever shown to users.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 6: Site and feature config  (Layer 1)
**Files to create:** `src/config/site.ts`, `src/config/features.ts`
**Read first:** PRD → §10, §12; TDD → §A.5, and each file's File_Map entry
**Reference:** onwidget/astrowind (MIT; also published as arthelokyo/astrowind):src/config.yaml — adapt
**Deliverables:**
1. site.ts: name, tagline, base URL from env, nav items, legal links.
2. features.ts: boolean flags for ads, affiliates and analytics parsed from env; defaults all off.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 7: Materials data  (Layer 1)
**Files to create:** `src/data/materials.ts`
**Read first:** PRD → Rules 4–5; Backend_Schema → §2 (static data), and each file's File_Map entry
**Reference:** stoffis-git/construction-utils (MIT):README Quick Start — idea-only
**Deliverables:**
1. Coverage, waste and pack presets exactly as the PRD Rule 4 table, each with a source note field.
2. Every preset is overridable and exported with its label for the Assumptions panel.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 8: Regions data  (Layer 1)
**Files to create:** `src/data/regions.ts`
**Read first:** PRD → Rule 17, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Four region presets (US, UK, CA, AU) with default unit system, currency code, locale and terminology labels (gallon/litre, sq ft/m²).
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 9: Room type presets  (Layer 1)
**Files to create:** `src/data/rooms.ts`
**Read first:** App_Flow → §A.1, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Four room-type presets (bedroom, living-room, kitchen, bathroom): slug, typical dimensions, intro copy, three FAQs each.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 10: Affiliate partners data  (Layer 1)
**Files to create:** `src/data/affiliates.ts`
**Read first:** PRD → Rule 15, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Partner table with id, store name, category, URL template and the env var that holds the tag. Partners with no approved program stay marked disabled.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 11: Test fixtures  (Layer 2)
**Files to create:** `tests/helpers/roomFixtures.ts`
**Read first:** Engineering_Plan → §A.4, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Factory functions for a valid room, a room with openings, a multi-room project and each invalid variant.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 12: Units  (Layer 2)
**Files to create:** `src/lib/calc/units.ts`, `tests/unit/units.test.ts`
**Read first:** PRD → Rule 10; TDD → §B.9, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Conversions m↔ft, m²↔sq ft, L↔US gal and L↔UK gal; ceilUp helper; metres as canonical unit; round-trip precision to 6 decimals.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/units.test.ts
```

### Batch 13: Validation  (Layer 2)
**Files to create:** `src/lib/calc/validation.ts`, `tests/unit/validation.test.ts`
**Read first:** PRD → Rule 7–8 and Plan Enforcement; TDD → §G.48, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. validateRoomInput, validateOpenings, validatePaintOptions, validateWaste, validatePrice with the limits in PRD Rule 7 and codes CALC_001–CALC_008.
2. Boundary tests: min, max, just outside, NaN, empty.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/validation.test.ts
```

### Batch 14: Geometry  (Layer 2)
**Files to create:** `src/lib/calc/geometry.ts`, `tests/unit/geometry.test.ts`
**Read first:** PRD → Rule 1; TDD → §B.9, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. floorArea, ceilingArea, grossWallArea, openingsArea, netWallArea; errors when openings exceed wall area (CALC_002).
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/geometry.test.ts
```

### Batch 15: Pack size optimiser  (Layer 2)
**Files to create:** `src/lib/calc/packSizes.ts`, `tests/unit/packSizes.test.ts`
**Read first:** PRD → Rule 3, and each file's File_Map entry
**Reference:** phcrepaldi/Paint-Calculator (MIT):README — idea-only
**Deliverables:**
1. choosePacks(requiredQuantity, packSizes[]) returns the cheapest-by-waste combination that covers the need, never below it, plus the exact unrounded need.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/packSizes.test.ts
```

### Batch 16: Paint calculator  (Layer 2)
**Files to create:** `src/lib/calc/paint.ts`, `tests/unit/paint.test.ts`
**Read first:** PRD → Rules 3–5; TDD → §B.9, and each file's File_Map entry
**Reference:** stoffis-git/construction-utils (MIT):README (paint helpers) — idea-only
**Deliverables:**
1. calculatePaint(room, options) returns wall paint, optional ceiling paint and optional primer as MaterialResults.
2. Tests against two hand-calculated rooms (one with a door and window, 2 coats).
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/paint.test.ts
```

### Batch 17: Flooring calculator  (Layer 2)
**Files to create:** `src/lib/calc/flooring.ts`, `tests/unit/flooring.test.ts`
**Read first:** PRD → Rules 3–5, and each file's File_Map entry
**Reference:** stoffis-git/construction-utils (MIT):README (flooring helpers) — idea-only
**Deliverables:**
1. calculateFlooring(room, options) with lay-pattern waste (straight 10%, diagonal 15%, herringbone 20%) and box rounding.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/flooring.test.ts
```

### Batch 18: Tile calculator  (Layer 2)
**Files to create:** `src/lib/calc/tile.ts`, `tests/unit/tile.test.ts`
**Read first:** PRD → Rules 3–5, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. calculateTile(room, options) for floor or wall surfaces with tile size, grout gap, layout waste and box rounding.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/tile.test.ts
```

### Batch 19: Wallpaper calculator  (Layer 2)
**Files to create:** `src/lib/calc/wallpaper.ts`, `tests/unit/wallpaper.test.ts`
**Read first:** PRD → Rules 3–5, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. calculateWallpaper(room, options) using drops per roll, pattern repeat and 10% spare, rounded up to whole rolls.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/wallpaper.test.ts
```

### Batch 20: Cost estimator  (Layer 2)
**Files to create:** `src/lib/calc/cost.ts`, `tests/unit/cost.test.ts`
**Read first:** PRD → Rule 6, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. estimateCost(result, unitPrice, region) returns a labelled estimate or null when no price is given; currency formatted by region locale.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/cost.test.ts
```

### Batch 21: Shopping list builder  (Layer 2)
**Files to create:** `src/lib/calc/shoppingList.ts`, `tests/unit/shoppingList.test.ts`
**Read first:** PRD → Rules 1, 3, 16, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. buildShoppingList(project) sums needs across rooms first, then rounds up once per material; includes assumptions used.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/shoppingList.test.ts
```

### Batch 22: Calculation API entry  (Layer 2)
**Files to create:** `src/lib/calc/index.ts`
**Read first:** TDD → §B.9, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Re-export only the public functions and types; no logic.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit
```

### Batch 23: Storage test doubles  (Layer 3)
**Files to create:** `tests/helpers/storageMock.ts`
**Read first:** Engineering_Plan → §A.4, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. A working in-memory Storage and a Storage that throws on every call.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 24: Safe storage and migrations  (Layer 3)
**Files to create:** `src/lib/state/storage.ts`, `src/lib/state/migrations.ts`, `tests/unit/storage.test.ts`
**Read first:** Backend_Schema → §5; TDD → §D.26, §E (tampering), and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. readProject / writeProject / clearProject under key roomtally:project:v1 with try/catch (STO_001) and invalid-data reset (STO_002).
2. Migrations map from older versions; unknown newer version resets safely.
3. Tests for empty, corrupt JSON, tampered numbers (negative, NaN, huge strings) and unavailable storage.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/storage.test.ts
```

### Batch 25: Project store  (Layer 3)
**Files to create:** `src/lib/state/projectStore.ts`, `tests/unit/projectStore.test.ts`
**Read first:** PRD → Rules 1, 7, 9, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. addRoom (limit 10, CALC_003), updateRoom, removeRoom, setSettings, subscribe, clearMyData.
2. Every write validates through validation.ts and persists through storage.ts.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/projectStore.test.ts -t "tampered"
pnpm exec vitest run tests/unit/projectStore.test.ts
```

### Batch 26: Design tokens stylesheet  (Layer 4)
**Files to create:** `src/styles/global.css`
**Read first:** Design_Brief → §A.3–A.5, §B.15, §B.17, and each file's File_Map entry
**Reference:** onwidget/astrowind (MIT; also published as arthelokyo/astrowind):src/assets/styles/tailwind.css — adapt
**Deliverables:**
1. Tailwind v4 import and theme tokens named exactly as the Design_Brief token table, light default, dark values, print rules, reduced-motion rule, focus ring.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 27: SEO meta helpers  (Layer 4)
**Files to create:** `src/lib/seo/meta.ts`
**Read first:** TDD → §H.56, §H.61, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Title, description and canonical builders per page type with the length limits in TDD §H.56.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 28: Structured data builders  (Layer 4)
**Files to create:** `src/lib/seo/schema.ts`, `tests/unit/schema.test.ts`
**Read first:** TDD → §H.59, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Builders for WebSite, WebApplication, FAQPage, BreadcrumbList and Article returning plain objects.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/schema.test.ts
```

### Batch 29: DOM helpers  (Layer 4)
**Files to create:** `src/lib/ui/dom.ts`
**Read first:** TDD → §D.26, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. select, setText, el(tag, attrs, children) using textContent only; no innerHTML helper exists.
2. installGlobalErrorHandler: listens for error and unhandledrejection, logs a one-line coded message, shows the single friendly banner from TDD §G.49.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
! grep -n "innerHTML" src/lib/ui/dom.ts
pnpm exec vitest run --passWithNoTests
```

### Batch 30: Unit and region toggle  (Layer 4)
**Files to create:** `src/lib/ui/unitToggle.ts`
**Read first:** PRD → Rules 10, 17, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Applies region and unit choice to settings; converts displayed values without changing stored metres.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
pnpm exec vitest run tests/unit/storage.test.ts -t "tampered"
```

### Batch 31: Analytics wrapper  (Layer 4)
**Files to create:** `src/lib/ui/analytics.ts`
**Read first:** PRD → §7, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. track(eventName, props) is a no-op unless the flag and analytics consent are both on; event names exactly as PRD §7.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 32: Consent manager  (Layer 4)
**Files to create:** `src/lib/ui/consent.ts`
**Read first:** PRD → Rules 13–14; TDD → §D, and each file's File_Map entry
**Reference:** orestbida/cookieconsent (MIT):docs (Google Consent Mode) — copy
**Deliverables:**
1. initConsent() sets Consent Mode defaults to denied, shows the banner with three categories (necessary, analytics, advertising), updates signals on choice, exposes openPreferences().
2. If the library fails to load, log CNS_001 and keep everything non-essential off.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 33: Ads loader and consent tests  (Layer 4)
**Files to create:** `src/lib/ui/ads.ts`, `tests/unit/ads-consent.test.ts`
**Read first:** PRD → Rules 12–13; TDD → §E (consent bypass), and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. loadAds() injects the AdSense script only after advertising consent and only when the flag is on; failure logs ADS_001 and keeps the reserved space empty.
2. Tests: nothing injected before consent; nothing after revoke; analytics wrapper silent without consent.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/ads-consent.test.ts
```

### Batch 34: Seo  (Layer 5)
**Files to create:** `src/components/layout/Seo.astro`
**Read first:** Design_Brief → §B.13; TDD §H, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build Seo.astro: emits title, meta, canonical, Open Graph, Twitter and JSON-LD tags. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 35: ThemeToggle  (Layer 5)
**Files to create:** `src/components/layout/ThemeToggle.astro`
**Read first:** Design_Brief → §B.13; Design_Brief §B.15, and each file's File_Map entry
**Reference:** onwidget/astrowind (MIT; also published as arthelokyo/astrowind):src/components/CustomStyles.astro — adapt
**Deliverables:**
1. Build ThemeToggle.astro: light/dark switch; light by default; remembers choice. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 36: UnitSwitch  (Layer 5)
**Files to create:** `src/components/common/UnitSwitch.astro`
**Read first:** Design_Brief → §B.13; PRD Rule 17, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build UnitSwitch.astro: region (US/UK/CA/AU) and metric/imperial switch. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 37: Header  (Layer 5)
**Files to create:** `src/components/layout/Header.astro`
**Read first:** Design_Brief → §B.13; App_Flow §A, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build Header.astro: site header with logo, nav, UnitSwitch and ThemeToggle. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 38: ConsentButton  (Layer 5)
**Files to create:** `src/components/common/ConsentButton.astro`
**Read first:** Design_Brief → §B.13; PRD Rule 14, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build ConsentButton.astro: button that reopens the cookie preference centre. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 39: Footer  (Layer 5)
**Files to create:** `src/components/layout/Footer.astro`
**Read first:** Design_Brief → §B.13; PRD Rule 14–15, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build Footer.astro: footer with legal links, disclosure line and ConsentButton. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 40: Breadcrumbs  (Layer 5)
**Files to create:** `src/components/common/Breadcrumbs.astro`
**Read first:** Design_Brief → §B.13; TDD §H.59, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build Breadcrumbs.astro: visible breadcrumb trail matching BreadcrumbList JSON-LD. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 41: FaqBlock  (Layer 5)
**Files to create:** `src/components/common/FaqBlock.astro`
**Read first:** Design_Brief → §B.13; TDD §H.59, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build FaqBlock.astro: accessible FAQ accordion that also feeds FAQPage JSON-LD. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 42: DisclaimerNote  (Layer 5)
**Files to create:** `src/components/common/DisclaimerNote.astro`
**Read first:** Design_Brief → §B.13; PRD Rule 11, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build DisclaimerNote.astro: accuracy disclaimer in short and full variants. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 43: OpeningsFieldset  (Layer 5)
**Files to create:** `src/components/room/OpeningsFieldset.astro`
**Read first:** Design_Brief → §B.13; PRD Rule 7, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build OpeningsFieldset.astro: repeatable door/window rows (width, height, count). Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 44: RoomForm  (Layer 5)
**Files to create:** `src/components/room/RoomForm.astro`
**Read first:** Design_Brief → §B.13; PRD Rule 1, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build RoomForm.astro: the one room input form (name, length, width, height, openings, options). Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 45: RoomList  (Layer 5)
**Files to create:** `src/components/room/RoomList.astro`
**Read first:** Design_Brief → §B.13; PRD Rule 1, 7, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build RoomList.astro: list of added rooms with edit and remove buttons. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 46: AssumptionsPanel  (Layer 5)
**Files to create:** `src/components/results/AssumptionsPanel.astro`
**Read first:** Design_Brief → §B.13; PRD Rule 5, NV5, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build AssumptionsPanel.astro: expandable panel showing every default and override used. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 47: MaterialCard  (Layer 5)
**Files to create:** `src/components/results/MaterialCard.astro`
**Read first:** Design_Brief → §B.13; PRD Rule 3, 6, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build MaterialCard.astro: one material's result: buy quantity, exact need, pack detail, cost. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 48: AdSlot  (Layer 5)
**Files to create:** `src/components/ads/AdSlot.astro`
**Read first:** Design_Brief → §B.13; PRD Rule 12, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build AdSlot.astro: fixed-height ad container labelled Advertisement; empty until ads load. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 49: AffiliateLink  (Layer 5)
**Files to create:** `src/components/ads/AffiliateLink.astro`
**Read first:** Design_Brief → §B.13; PRD Rule 15, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build AffiliateLink.astro: affiliate link with sponsored/nofollow rel and disclosure marker. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 50: ShoppingList  (Layer 5)
**Files to create:** `src/components/results/ShoppingList.astro`
**Read first:** Design_Brief → §B.13; PRD Rule 1, 16, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build ShoppingList.astro: the combined shopping list container with MaterialCards, totals, print button, where-to-buy links. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 51: CalculatorShell  (Layer 5)
**Files to create:** `src/components/calculators/CalculatorShell.astro`
**Read first:** Design_Brief → §B.13; App_Flow §A.1, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build CalculatorShell.astro: shared wrapper for each single-material calculator page. Props exactly as the Design_Brief §B.13 table; no business logic, markup and tokens only.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 52: Base layout  (Layer 6)
**Files to create:** `src/layouts/BaseLayout.astro`
**Read first:** Design_Brief → §B.12; TDD → §C.15, and each file's File_Map entry
**Reference:** onwidget/astrowind (MIT; also published as arthelokyo/astrowind):src/layouts/PageLayout.astro — adapt
**Deliverables:**
1. Imports global.css, Seo, Header, Footer; sets lang en; includes the consent init script and the no-flash theme script.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 53: Guide layout  (Layer 6)
**Files to create:** `src/layouts/GuideLayout.astro`
**Read first:** App_Flow → §A.1, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Article layout with breadcrumbs, Article JSON-LD and two in-article AdSlots (max 3 ad units per page).
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 54: Legal layout  (Layer 6)
**Files to create:** `src/layouts/LegalLayout.astro`
**Read first:** PRD → Rule 12, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Plain content layout; no AdSlot anywhere.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 55: Results renderer  (Layer 7)
**Files to create:** `src/lib/ui/renderResults.ts`, `tests/unit/renderResults.test.ts`
**Read first:** PRD → Rules 3, 6; TDD → §E (XSS), and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. renderShoppingList(container, list) builds MaterialCards via dom.ts; shows buy quantity first and exact need second.
2. Test that a room name containing markup renders as text.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run tests/unit/renderResults.test.ts
```

### Batch 56: Room form binding  (Layer 7)
**Files to create:** `src/lib/ui/bindRoomForm.ts`
**Read first:** PRD → Rules 1, 8; App_Flow → §B.7, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Reads the form, validates, shows field-level error messages with codes, saves to the store, re-renders results on every valid change.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
pnpm exec vitest run tests/unit/storage.test.ts -t "tampered"
```

### Batch 57: Print list  (Layer 7)
**Files to create:** `src/lib/ui/printList.ts`
**Read first:** PRD → Rule 16, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. printShoppingList() adds a print-only title and date, calls window.print, and removes them afterwards.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec astro check
pnpm exec vitest run --passWithNoTests
```

### Batch 58: index  (Layer 8)
**Files to create:** `src/pages/index.astro`
**Read first:** App_Flow → §A.1; Design_Brief → §B.12, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build src/pages/index.astro: home page: hero, whole-project estimator, results, intro copy, FAQ, ad slots. Uses only components named in File_Map; copy and headings follow PRD §10–13.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 59: paint-calculator/index  (Layer 8)
**Files to create:** `src/pages/paint-calculator/index.astro`
**Read first:** App_Flow → §A.1; Design_Brief → §B.12, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build src/pages/paint-calculator/index.astro: paint calculator page. Uses only components named in File_Map; copy and headings follow PRD §10–13.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 60: paint-calculator/[room]  (Layer 8)
**Files to create:** `src/pages/paint-calculator/[room].astro`
**Read first:** App_Flow → §A.1; Design_Brief → §B.12, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build src/pages/paint-calculator/[room].astro: generates the four room-type paint pages from src/data/rooms.ts. Uses only components named in File_Map; copy and headings follow PRD §10–13.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 61: flooring-calculator/index  (Layer 8)
**Files to create:** `src/pages/flooring-calculator/index.astro`
**Read first:** App_Flow → §A.1; Design_Brief → §B.12, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build src/pages/flooring-calculator/index.astro: flooring calculator page. Uses only components named in File_Map; copy and headings follow PRD §10–13.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 62: tile-calculator/index  (Layer 8)
**Files to create:** `src/pages/tile-calculator/index.astro`
**Read first:** App_Flow → §A.1; Design_Brief → §B.12, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build src/pages/tile-calculator/index.astro: tile calculator page. Uses only components named in File_Map; copy and headings follow PRD §10–13.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 63: wallpaper-calculator/index  (Layer 8)
**Files to create:** `src/pages/wallpaper-calculator/index.astro`
**Read first:** App_Flow → §A.1; Design_Brief → §B.12, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build src/pages/wallpaper-calculator/index.astro: wallpaper calculator page. Uses only components named in File_Map; copy and headings follow PRD §10–13.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 64: 404  (Layer 8)
**Files to create:** `src/pages/404.astro`
**Read first:** App_Flow → §A.1; Design_Brief → §B.12, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Build src/pages/404.astro: not-found page with search-free recovery links. Uses only components named in File_Map; copy and headings follow PRD §10–13.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 65: Content collection config  (Layer 9)
**Files to create:** `src/content.config.ts`
**Read first:** App_Flow → §A.1, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Guides collection with title, description, updated date, and faq items.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 66: Guide: how-much-paint-for-a-room  (Layer 9)
**Files to create:** `src/content/guides/how-much-paint-for-a-room.md`
**Read first:** PRD → Rules 11–13; App_Flow → §A.1, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. 800–1,200 words of original, practical guidance in the PRD voice; one worked example; links to the matching calculator; front matter per content.config.ts.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 67: Guide: flooring-waste-factor  (Layer 9)
**Files to create:** `src/content/guides/flooring-waste-factor.md`
**Read first:** PRD → Rules 11–13; App_Flow → §A.1, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. 800–1,200 words of original, practical guidance in the PRD voice; one worked example; links to the matching calculator; front matter per content.config.ts.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 68: Guide: how-to-measure-a-room  (Layer 9)
**Files to create:** `src/content/guides/how-to-measure-a-room.md`
**Read first:** PRD → Rules 11–13; App_Flow → §A.1, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. 800–1,200 words of original, practical guidance in the PRD voice; one worked example; links to the matching calculator; front matter per content.config.ts.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 69: Guide: tile-layout-and-waste  (Layer 9)
**Files to create:** `src/content/guides/tile-layout-and-waste.md`
**Read first:** PRD → Rules 11–13; App_Flow → §A.1, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. 800–1,200 words of original, practical guidance in the PRD voice; one worked example; links to the matching calculator; front matter per content.config.ts.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 70: Guides pages  (Layer 9)
**Files to create:** `src/pages/guides/index.astro`, `src/pages/guides/[slug].astro`
**Read first:** App_Flow → §A.1, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Index lists all guides; [slug] renders one with GuideLayout; getStaticPaths from the collection.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 71: Legal page: about  (Layer 9)
**Files to create:** `src/pages/about.astro`
**Read first:** PRD → Rules 9, 11, 14, 15, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Plain-language about page using LegalLayout; no ads; legal text flagged for review by a qualified person before launch.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 72: Legal page: privacy  (Layer 9)
**Files to create:** `src/pages/privacy.astro`
**Read first:** PRD → Rules 9, 11, 14, 15, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Plain-language privacy page using LegalLayout; no ads; legal text flagged for review by a qualified person before launch.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 73: Legal page: cookies  (Layer 9)
**Files to create:** `src/pages/cookies.astro`
**Read first:** PRD → Rules 9, 11, 14, 15, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Plain-language cookies page using LegalLayout; no ads; legal text flagged for review by a qualified person before launch.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 74: Legal page: terms  (Layer 9)
**Files to create:** `src/pages/terms.astro`
**Read first:** PRD → Rules 9, 11, 14, 15, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Plain-language terms page using LegalLayout; no ads; legal text flagged for review by a qualified person before launch.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 75: Legal page: disclaimer  (Layer 9)
**Files to create:** `src/pages/disclaimer.astro`
**Read first:** PRD → Rules 9, 11, 14, 15, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Plain-language disclaimer page using LegalLayout; no ads; legal text flagged for review by a qualified person before launch.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec vitest run --passWithNoTests
```

### Batch 76: Headers  (Layer 10)
**Files to create:** `public/_headers`
**Read first:** TDD → §D.30–D.31, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Exact header values from TDD §D.31 including the CSP allowances for AdSense.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
test -s public/_headers
pnpm exec vitest run --passWithNoTests
```

### Batch 77: Crawl and ads files  (Layer 10)
**Files to create:** `public/robots.txt`, `public/ads.txt`
**Read first:** TDD → §H.58; PRD → §6, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. robots.txt allows all and lists the sitemap index; ads.txt stays a comment until the AdSense publisher ID exists.
**Gate checks (all must pass before the next batch):**
```bash
test -s public/robots.txt
pnpm exec vitest run --passWithNoTests
```

### Batch 78: Icons and share image  (Layer 10)
**Files to create:** `public/favicon.svg`, `public/favicon-32.png`, `public/apple-touch-icon.png`, `public/og-default.png`
**Read first:** Design_Brief → §A.6–A.7, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Tally-mark glyph in Clay on Cream; sizes exactly as Design_Brief §A.7; OG image 1200×630 with wordmark and tagline.
**Gate checks (all must pass before the next batch):**
```bash
test -s public/favicon.svg && test -s public/og-default.png
pnpm exec vitest run --passWithNoTests
```

### Batch 79: E2E: home flow  (Layer 11)
**Files to create:** `tests/e2e/home-flow.spec.ts`
**Read first:** App_Flow → §B.7; Engineering_Plan → §A.8, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Journey 1 end to end including the invalid-input branch and clear-my-data.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm exec playwright test tests/e2e/home-flow.spec.ts
```

### Batch 80: E2E: calculators  (Layer 11)
**Files to create:** `tests/e2e/calculators.spec.ts`
**Read first:** Engineering_Plan → §A.8, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. One known room per calculator with the expected result from the unit tests.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec playwright test tests/e2e/calculators.spec.ts
```

### Batch 81: E2E: consent  (Layer 11)
**Files to create:** `tests/e2e/consent.spec.ts`
**Read first:** PRD → NV2; TDD → §E, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Assert no request to ad or analytics hosts before consent; accept then assert the ad script loads; reopen from footer.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec playwright test tests/e2e/consent.spec.ts
```

### Batch 82: E2E: SEO  (Layer 11)
**Files to create:** `tests/e2e/seo.spec.ts`
**Read first:** TDD → §H, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Every route in App_Flow §A.1 has one h1, title, description, canonical and parseable JSON-LD.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec playwright test tests/e2e/seo.spec.ts
```

### Batch 83: Bundle size check  (Layer 11)
**Files to create:** `scripts/check-bundle-size.mjs`
**Read first:** TDD → §F.46, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Fail when total first-party JS gzip exceeds 60 KB; print the largest files.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm run size
pnpm exec vitest run --passWithNoTests
```

### Batch 84: SEO check script  (Layer 11)
**Files to create:** `scripts/check-seo.mjs`
**Read first:** TDD → §H, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Scan dist/ HTML for missing title, description, canonical, duplicate h1 or accidental noindex.
**Gate checks (all must pass before the next batch):**
```bash
pnpm run build
pnpm run seo:check
pnpm exec vitest run --passWithNoTests
```

### Batch 85: CI workflow  (Layer 12)
**Files to create:** `.github/workflows/ci.yml`
**Read first:** Engineering_Plan → §B.11–B.12, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Stages and exact commands from Engineering_Plan §B.12; Node from .nvmrc.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec prettier --check .github/workflows/ci.yml
pnpm exec vitest run --passWithNoTests
```

### Batch 86: Deploy workflow  (Layer 12)
**Files to create:** `.github/workflows/deploy.yml`
**Read first:** Engineering_Plan → §B.14–B.15, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Runs only on main after CI; uses the two Cloudflare secrets named in TDD §A.5.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec prettier --check .github/workflows/deploy.yml
pnpm exec vitest run --passWithNoTests
```

### Batch 87: Dependabot  (Layer 12)
**Files to create:** `.github/dependabot.yml`
**Read first:** TDD → §D.33, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Weekly updates for the npm ecosystem (pnpm lockfile) and github-actions; group minor and patch.
**Gate checks (all must pass before the next batch):**
```bash
test -s .github/dependabot.yml
pnpm exec vitest run --passWithNoTests
```

### Batch 88: README  (Layer 12)
**Files to create:** `README.md`
**Read first:** all docs, and each file's File_Map entry
**Reference:** none — write from the spec
**Deliverables:**
1. Setup, scripts, deploy and the where-to-find-things table.
**Gate checks (all must pass before the next batch):**
```bash
pnpm exec prettier --check README.md
pnpm exec vitest run --passWithNoTests
```

## 3. Quick Reference — Fix Prompts
1. **Failing unit test:** "Run `pnpm exec vitest run <file>`. Explain in one sentence why it fails, fix the code (not the test) unless the test contradicts PRD/TDD, and rerun."
2. **Type error:** "Run `pnpm exec astro check`. Fix every error without using `any` or ignore comments."
3. **Wrong quantity:** "Hand-calculate this room: <dimensions>. Compare with `buildShoppingList`. Find the first step that differs (net area, coverage, waste, pack rounding) and fix it, adding a test."
4. **Rounding bug:** "Totals must sum across rooms first and round up once (PRD Rule 3). Find any per-room rounding and remove it; add a test in `tests/unit/shoppingList.test.ts`."
5. **Consent bypass:** "A request to an ad or analytics host happens before consent. Remove any static script tag and make `loadAds` the only injector; run `pnpm exec playwright test tests/e2e/consent.spec.ts`."
6. **XSS risk:** "Search `src/` for `innerHTML`. Replace with `dom.ts` helpers and add a test that markup in a room name renders as text."
7. **Layout shift from ads:** "Give every `AdSlot` a fixed min-height from Design_Brief and confirm CLS stays ≤ 0.05 in the preview."
8. **Bundle over budget:** "Run `pnpm run size`. List the three largest first-party files, remove unused imports, lazy-load consent and ads code, and rerun."
9. **Corrupt storage crash:** "Set the project key to bad JSON. Make `readProject` reset safely (STO_002) and show the note; extend `tests/unit/storage.test.ts`."
10. **Markdown build error:** "If `astro build` asks for a Markdown package, install exactly the version named in TDD §A.2 and rerun `pnpm run build`."
11. **Design drift:** "Compare this component with Design_Brief §A.5 tokens and §B.13 props. Replace hard-coded colours, sizes or fonts with tokens."
12. **CSP blocks ads:** "With ads enabled in preview, read the browser's CSP errors, add only the exact missing host to `public/_headers`, and note it in TDD §D.31."
13. **Page missing from sitemap or SEO check:** "Run `pnpm run build && pnpm run seo:check`. Fix the page's title, description, canonical or h1 per TDD §H.56."
14. **Dark mode flash:** "The inline theme script in `BaseLayout.astro` must run before first paint; move it into the head and retest."
15. **Print layout broken:** "Open the print preview; hide header, footer, ads and form via the print rules in `global.css`; keep the shopping list on one page."

## 4. Reference Repos
| Repo | URL | License | Why it's relevant | Paths worth studying | Use |
|------|-----|---------|-------------------|----------------------|-----|
| onwidget/astrowind | https://github.com/onwidget/astrowind | MIT | Astro 7 + Tailwind CSS 4 theme with dark mode and SEO setup; also published as arthelokyo/astrowind | `src/config.yaml`, `src/components/CustomStyles.astro`, `src/assets/styles/tailwind.css`, `src/layouts/PageLayout.astro`, `src/pages/index.astro` | adapt |
| orestbida/cookieconsent | https://github.com/orestbida/cookieconsent | MIT | Consent banner and preference centre; documents Google Consent Mode integration (docs at cookieconsent.orestbida.com) | documentation site (Consent Mode section); installed from the npm registry as vanilla-cookieconsent | copy |
| stoffis-git/construction-utils | https://github.com/stoffis-git/construction-utils | MIT | Construction formula helpers (paint gallons, primer, flooring sq ft, tile boxes, drywall sheets) to cross-check our formulas | README Quick Start function list (repo file layout not verified) | idea-only |
| phcrepaldi/Paint-Calculator | https://github.com/phcrepaldi/Paint-Calculator | MIT | Small paint calculator that splits a quantity into 1 L and 5 L cans | README feature list (repo file layout not verified) | idea-only |

Use modes are as in File_Map.md.

> **Doc Info** — Last updated: 2026-11-12 · Reason: Switched package manager from npm to pnpm

# File_Map — Roomtally

Every file the finished project needs. Entry format: `path` [goal], (connections), then layer, dependencies, what it implements, the batch that builds it, and the model-after repo. Layers match Build_prompts.md.

## 1. Project Directory Tree

```
├── .env.example
├── .github/   # CI/CD
│   ├── dependabot.yml
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .gitignore
├── .nvmrc
├── .prettierignore
├── .prettierrc.json
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── agents/   # the documentation suite
│   ├── App_Flow.md
│   ├── Backend_Schema.md
│   ├── Build_prompts.md
│   ├── Design_Brief.md
│   ├── Engineering_Plan.md
│   ├── File_Map.md
│   ├── PRD.md
│   └── TDD.md
├── astro.config.ts
├── pnpm-lock.yaml
├── package.json
├── playwright.config.ts
├── public/   # served as-is
│   ├── _headers
│   ├── ads.txt
│   ├── apple-touch-icon.png
│   ├── favicon-32.png
│   ├── favicon.svg
│   ├── og-default.png
│   └── robots.txt
├── scripts/   # build checks
│   ├── check-bundle-size.mjs
│   └── check-seo.mjs
├── src/   # application source
│   ├── components/   # Astro components
│   │   ├── ads/
│   │   │   ├── AdSlot.astro
│   │   │   └── AffiliateLink.astro
│   │   ├── calculators/
│   │   │   └── CalculatorShell.astro
│   │   ├── common/
│   │   │   ├── Breadcrumbs.astro
│   │   │   ├── ConsentButton.astro
│   │   │   ├── DisclaimerNote.astro
│   │   │   ├── FaqBlock.astro
│   │   │   └── UnitSwitch.astro
│   │   ├── layout/
│   │   │   ├── Footer.astro
│   │   │   ├── Header.astro
│   │   │   ├── Seo.astro
│   │   │   └── ThemeToggle.astro
│   │   ├── results/
│   │   │   ├── AssumptionsPanel.astro
│   │   │   ├── MaterialCard.astro
│   │   │   └── ShoppingList.astro
│   │   └── room/
│   │       ├── OpeningsFieldset.astro
│   │       ├── RoomForm.astro
│   │       └── RoomList.astro
│   ├── config/   # site and feature config
│   │   ├── features.ts
│   │   └── site.ts
│   ├── content.config.ts
│   ├── content/   # Markdown guides
│   │   └── guides/
│   │       ├── flooring-waste-factor.md
│   │       ├── how-much-paint-for-a-room.md
│   │       ├── how-to-measure-a-room.md
│   │       └── tile-layout-and-waste.md
│   ├── data/   # static presets
│   │   ├── affiliates.ts
│   │   ├── materials.ts
│   │   ├── regions.ts
│   │   └── rooms.ts
│   ├── layouts/   # page shells
│   │   ├── BaseLayout.astro
│   │   ├── GuideLayout.astro
│   │   └── LegalLayout.astro
│   ├── lib/   # logic
│   │   ├── calc/   # pure calculation engine
│   │   │   ├── cost.ts
│   │   │   ├── errors.ts
│   │   │   ├── flooring.ts
│   │   │   ├── geometry.ts
│   │   │   ├── index.ts
│   │   │   ├── packSizes.ts
│   │   │   ├── paint.ts
│   │   │   ├── shoppingList.ts
│   │   │   ├── tile.ts
│   │   │   ├── units.ts
│   │   │   ├── validation.ts
│   │   │   └── wallpaper.ts
│   │   ├── seo/   # meta and JSON-LD builders
│   │   │   ├── meta.ts
│   │   │   └── schema.ts
│   │   ├── state/   # store and storage
│   │   │   ├── migrations.ts
│   │   │   ├── projectStore.ts
│   │   │   └── storage.ts
│   │   └── ui/   # browser scripts
│   │       ├── ads.ts
│   │       ├── analytics.ts
│   │       ├── bindRoomForm.ts
│   │       ├── consent.ts
│   │       ├── dom.ts
│   │       ├── printList.ts
│   │       ├── renderResults.ts
│   │       └── unitToggle.ts
│   ├── pages/   # routes
│   │   ├── 404.astro
│   │   ├── about.astro
│   │   ├── cookies.astro
│   │   ├── disclaimer.astro
│   │   ├── flooring-calculator/
│   │   │   └── index.astro
│   │   ├── guides/
│   │   │   ├── [slug].astro
│   │   │   └── index.astro
│   │   ├── index.astro
│   │   ├── paint-calculator/
│   │   │   ├── [room].astro
│   │   │   └── index.astro
│   │   ├── privacy.astro
│   │   ├── terms.astro
│   │   ├── tile-calculator/
│   │   │   └── index.astro
│   │   └── wallpaper-calculator/
│   │       └── index.astro
│   ├── styles/   # design tokens
│   │   └── global.css
│   └── types/   # shared types
│       ├── calc.ts
│       └── project.ts
├── tests/   # unit, e2e, helpers
│   ├── e2e/
│   │   ├── calculators.spec.ts
│   │   ├── consent.spec.ts
│   │   ├── home-flow.spec.ts
│   │   └── seo.spec.ts
│   ├── helpers/
│   │   ├── roomFixtures.ts
│   │   └── storageMock.ts
│   └── unit/
│       ├── ads-consent.test.ts
│       ├── cost.test.ts
│       ├── flooring.test.ts
│       ├── geometry.test.ts
│       ├── packSizes.test.ts
│       ├── paint.test.ts
│       ├── projectStore.test.ts
│       ├── renderResults.test.ts
│       ├── schema.test.ts
│       ├── shoppingList.test.ts
│       ├── storage.test.ts
│       ├── tile.test.ts
│       ├── units.test.ts
│       ├── validation.test.ts
│       └── wallpaper.test.ts
├── tsconfig.json
├── vitest.config.ts
└── wrangler.toml
```

## 2. File Entries (grouped by area, in dependency order)

### Root config and tooling

`.env.example` [lists every environment variable name with a safe example value], (copied to .env locally; read by astro.config.ts and src/config/*.ts)
  Layer: 0 · Depends on: — · Implements: TDD §A.5 · Built by: Batch 2

`.gitignore` [keeps node_modules, dist, .env, test reports out of git], (read by git)
  Layer: 0 · Depends on: — · Implements: — · Built by: Batch 2

`.nvmrc` [pins the Node version (22.23.4)], (read by nvm and by CI setup-node)
  Layer: 0 · Depends on: — · Implements: TDD §A.1 · Built by: Batch 2

`.prettierignore` [excludes dist and lockfile from formatting], (read by prettier)
  Layer: 0 · Depends on: — · Implements: — · Built by: Batch 2

`.prettierrc.json` [Prettier formatting rules incl. the Astro plugin], (read by prettier and the editor)
  Layer: 0 · Depends on: `package.json` · Implements: TDD §B.14 · Built by: Batch 2

`astro.config.ts` [Astro build config: static output, trailing slashes, sitemap integration, Tailwind Vite plugin, site URL], (read by astro dev/build; imports @astrojs/sitemap and @tailwindcss/vite)
  Layer: 0 · Depends on: `package.json`, `.env.example` · Implements: TDD §C.15, §H.57 · Built by: Batch 3
  Model after: onwidget/astrowind (MIT; also published as arthelokyo/astrowind):astro.config.ts — idea-only

`pnpm-lock.yaml` [lockfile created by pnpm install so every machine gets identical versions], (read by pnpm install --frozen-lockfile in CI)
  Layer: 0 · Depends on: `package.json` · Implements: TDD §A · Built by: Batch 2

`package.json` [declares exact dependency pins, the packageManager pin, Node engine and the pnpm scripts (dev, build, check, test, test:e2e, format, size, seo:check)], (read by pnpm, CI and Cloudflare Pages; scripts call astro, vitest, playwright, prettier and the scripts/ files)
  Layer: 0 · Depends on: — · Implements: TDD §A.2–A.4 · Built by: Batch 2
  Model after: onwidget/astrowind (MIT; also published as arthelokyo/astrowind):package.json — adapt

`playwright.config.ts` [Playwright config: Chromium + mobile viewport, runs against the built site via astro preview], (read by playwright test and CI)
  Layer: 0 · Depends on: `astro.config.ts` · Implements: Engineering_Plan §A.8 · Built by: Batch 3

`tsconfig.json` [strict TypeScript settings extending Astro's strict preset], (read by astro check, vitest and the editor)
  Layer: 0 · Depends on: `package.json` · Implements: TDD §C.21 · Built by: Batch 2

`vitest.config.ts` [Vitest config: node environment default, jsdom opt-in for DOM tests, coverage thresholds], (read by vitest and CI)
  Layer: 0 · Depends on: `tsconfig.json` · Implements: Engineering_Plan §A.2 · Built by: Batch 3

`wrangler.toml` [Cloudflare Pages project settings (name, build output dir)], (read by wrangler during deploy)
  Layer: 0 · Depends on: `astro.config.ts` · Implements: TDD §F.42, Engineering_Plan §B.14 · Built by: Batch 3

`README.md` [human-facing project overview, setup and deploy steps], (read by people on GitHub)
  Layer: 12 · Depends on: all docs · Implements: — · Built by: Batch 88


### Types

`src/types/calc.ts` [type definitions for calculator options, results and the ShoppingList], (imported by every calculator and renderer)
  Layer: 1 · Depends on: `src/types/project.ts` · Implements: TDD §B.9 · Built by: Batch 4

`src/types/project.ts` [type definitions for Project, Room, Opening, Settings (the stored data model)], (imported by storage, store, calc and UI files)
  Layer: 1 · Depends on: — · Implements: Backend_Schema §2 · Built by: Batch 4


### Site config

`src/config/features.ts` [feature flags read from env: ads, affiliates, analytics], (imported by ads.ts, AffiliateLink.astro, analytics.ts)
  Layer: 1 · Depends on: `.env.example` · Implements: PRD Rule 12–15 · Built by: Batch 6

`src/config/site.ts` [site name, tagline, base URL, nav items and legal links in one place], (imported by Seo, Header, Footer, meta.ts and schema.ts)
  Layer: 1 · Depends on: `.env.example` · Implements: PRD §10, TDD §H.56 · Built by: Batch 6
  Model after: onwidget/astrowind (MIT; also published as arthelokyo/astrowind):src/config.yaml — adapt


### Static data

`src/data/affiliates.ts` [affiliate partner table: id, store name, category, URL template, env var for tag], (imported by AffiliateLink.astro and ShoppingList.astro)
  Layer: 1 · Depends on: `src/config/features.ts` · Implements: PRD Rule 15 · Built by: Batch 10

`src/data/materials.ts` [default coverage rates, pack sizes and waste presets per material and lay pattern], (imported by calculators, assumptions panel and forms)
  Layer: 1 · Depends on: `src/types/calc.ts` · Implements: PRD Rule 4–5 · Built by: Batch 7
  Model after: stoffis-git/construction-utils (MIT):README Quick Start (paint, flooring, tile helper defaults) — idea-only

`src/data/regions.ts` [region presets (US, UK, CA, AU): units, currency, terms, default coverage units], (imported by unitToggle.ts, cost.ts, forms and Header)
  Layer: 1 · Depends on: `src/types/project.ts` · Implements: PRD Rule 17 · Built by: Batch 8

`src/data/rooms.ts` [room-type presets (bedroom, living-room, kitchen, bathroom): typical sizes, copy, FAQs], (imported by paint-calculator/[room].astro and the form presets)
  Layer: 1 · Depends on: `src/types/project.ts` · Implements: App_Flow §A.1 · Built by: Batch 9


### Calculation engine

`src/lib/calc/errors.ts` [error-code catalogue and the CalcValidationError class], (imported by validation.ts, storage.ts and UI scripts that show messages)
  Layer: 1 · Depends on: — · Implements: TDD §G.48–50 · Built by: Batch 5

`src/lib/calc/cost.ts` [turns quantities and user-supplied unit prices into labelled cost estimates], (called by shoppingList.ts)
  Layer: 2 · Depends on: `src/data/regions.ts`, `src/types/calc.ts` · Implements: PRD Rule 6 · Built by: Batch 20

`src/lib/calc/flooring.ts` [calculates flooring boxes from floor area, lay pattern waste and box coverage], (called by shoppingList.ts and the flooring page)
  Layer: 2 · Depends on: `src/lib/calc/geometry.ts`, `src/lib/calc/packSizes.ts`, `src/data/materials.ts` · Implements: PRD Rule 3–5 · Built by: Batch 17
  Model after: stoffis-git/construction-utils (MIT):README (flooring.flooringSqft, tileBoxes) — idea-only

`src/lib/calc/geometry.ts` [computes floor, ceiling, gross wall and net wall areas, minus openings], (called by paint, tile, wallpaper and flooring calculators)
  Layer: 2 · Depends on: `src/lib/calc/units.ts` · Implements: PRD Rule 1 · Built by: Batch 14

`src/lib/calc/index.ts` [single public entry exporting the calculation API], (imported by UI scripts and pages)
  Layer: 2 · Depends on: all `src/lib/calc/*.ts` · Implements: TDD §B.9 · Built by: Batch 22

`src/lib/calc/packSizes.ts` [finds the cheapest combination of pack sizes covering a required quantity, rounding up], (called by paint, flooring, tile and wallpaper calculators)
  Layer: 2 · Depends on: `src/lib/calc/units.ts` · Implements: PRD Rule 3 · Built by: Batch 15
  Model after: phcrepaldi/Paint-Calculator (MIT):README (1 L and 5 L can splitting) — idea-only

`src/lib/calc/paint.ts` [calculates wall, ceiling and primer quantities from net area, coats and coverage], (called by shoppingList.ts and the paint calculator pages)
  Layer: 2 · Depends on: `src/lib/calc/geometry.ts`, `src/lib/calc/packSizes.ts`, `src/data/materials.ts` · Implements: PRD Rule 3–5 · Built by: Batch 16
  Model after: stoffis-git/construction-utils (MIT):README (paint.paintGallons, primerGallons) — idea-only

`src/lib/calc/shoppingList.ts` [combines per-room results into one project ShoppingList with totals per material], (called by the results renderer and the print function)
  Layer: 2 · Depends on: `src/lib/calc/paint.ts`, `src/lib/calc/flooring.ts`, `src/lib/calc/tile.ts`, `src/lib/calc/wallpaper.ts`, `src/lib/calc/cost.ts` · Implements: PRD Rule 1, 3, 16 · Built by: Batch 21

`src/lib/calc/tile.ts` [calculates tile count and boxes from area, tile size, grout gap and layout waste], (called by shoppingList.ts and the tile page)
  Layer: 2 · Depends on: `src/lib/calc/geometry.ts`, `src/lib/calc/packSizes.ts`, `src/data/materials.ts` · Implements: PRD Rule 3–5 · Built by: Batch 18

`src/lib/calc/units.ts` [length/area/volume conversions and rounding helpers (canonical unit: metres)], (imported by every calculator and the UI)
  Layer: 2 · Depends on: `src/types/calc.ts` · Implements: PRD Rule 10 · Built by: Batch 12

`src/lib/calc/validation.ts` [validates room, openings, options, waste and price against the numeric limits], (called by projectStore and bindRoomForm before any calculation)
  Layer: 2 · Depends on: `src/lib/calc/errors.ts`, `src/types/project.ts` · Implements: PRD Rule 7–8 · Built by: Batch 13

`src/lib/calc/wallpaper.ts` [calculates wallpaper rolls from wall area, roll size and pattern repeat], (called by shoppingList.ts and the wallpaper page)
  Layer: 2 · Depends on: `src/lib/calc/geometry.ts`, `src/lib/calc/packSizes.ts`, `src/data/materials.ts` · Implements: PRD Rule 3–5 · Built by: Batch 19


### Test helpers

`tests/helpers/roomFixtures.ts` [factory functions that build valid and invalid Room/Project fixtures], (imported by every unit test)
  Layer: 2 · Depends on: `src/types/project.ts` · Implements: Engineering_Plan §A.4 · Built by: Batch 11

`tests/helpers/storageMock.ts` [in-memory and failing localStorage stand-ins for tests], (imported by storage and store tests)
  Layer: 3 · Depends on: — · Implements: Engineering_Plan §A.4 · Built by: Batch 23


### Unit tests

`tests/unit/cost.test.ts` [tests cost with and without prices, currency formatting, zero price], (run by vitest)
  Layer: 2 · Depends on: `src/lib/calc/cost.ts` · Implements: Engineering_Plan §A.3 · Built by: Batch 20

`tests/unit/flooring.test.ts` [tests straight, diagonal and herringbone waste and box rounding], (run by vitest)
  Layer: 2 · Depends on: `src/lib/calc/flooring.ts` · Implements: Engineering_Plan §A.3 · Built by: Batch 17

`tests/unit/geometry.test.ts` [tests areas for rectangles with and without openings], (run by vitest)
  Layer: 2 · Depends on: `src/lib/calc/geometry.ts` · Implements: Engineering_Plan §A.3 · Built by: Batch 14

`tests/unit/packSizes.test.ts` [tests exact fits, round-up, single pack, and cheapest combination choice], (run by vitest)
  Layer: 2 · Depends on: `src/lib/calc/packSizes.ts` · Implements: Engineering_Plan §A.3 · Built by: Batch 15

`tests/unit/paint.test.ts` [tests paint results against hand-calculated rooms incl. openings and 2 coats], (run by vitest)
  Layer: 2 · Depends on: `src/lib/calc/paint.ts` · Implements: Engineering_Plan §A.3 · Built by: Batch 16

`tests/unit/shoppingList.test.ts` [tests multi-room totals and that totals round up once, after summing rooms], (run by vitest)
  Layer: 2 · Depends on: `src/lib/calc/shoppingList.ts` · Implements: Engineering_Plan §A.3 · Built by: Batch 21

`tests/unit/tile.test.ts` [tests tile counts for floor and wall, grout gap and layout waste], (run by vitest)
  Layer: 2 · Depends on: `src/lib/calc/tile.ts` · Implements: Engineering_Plan §A.3 · Built by: Batch 18

`tests/unit/units.test.ts` [tests conversions both ways, rounding up to packs, no precision loss on round trips], (run by vitest)
  Layer: 2 · Depends on: `src/lib/calc/units.ts` · Implements: Engineering_Plan §A.3 · Built by: Batch 12

`tests/unit/validation.test.ts` [tests every limit boundary and every error code], (run by vitest)
  Layer: 2 · Depends on: `src/lib/calc/validation.ts`, `tests/helpers/roomFixtures.ts` · Implements: Engineering_Plan §A.7 · Built by: Batch 13

`tests/unit/wallpaper.test.ts` [tests drops per roll, pattern repeat waste and roll rounding], (run by vitest)
  Layer: 2 · Depends on: `src/lib/calc/wallpaper.ts` · Implements: Engineering_Plan §A.3 · Built by: Batch 19

`tests/unit/projectStore.test.ts` [tests add/remove rooms, limit of 10, persistence and clear-my-data], (run by vitest)
  Layer: 3 · Depends on: `src/lib/state/projectStore.ts` · Implements: Engineering_Plan §A.3 · Built by: Batch 25

`tests/unit/storage.test.ts` [tests empty, corrupt, tampered, oversized and unavailable storage], (run by vitest)
  Layer: 3 · Depends on: `src/lib/state/storage.ts`, `tests/helpers/storageMock.ts` · Implements: TDD §E · Built by: Batch 24

`tests/unit/ads-consent.test.ts` [tests no ad or analytics script is added before consent and removed behaviour after revoke], (run by vitest (jsdom))
  Layer: 4 · Depends on: `src/lib/ui/ads.ts`, `src/lib/ui/consent.ts`, `src/lib/ui/analytics.ts` · Implements: NV2 · Built by: Batch 33

`tests/unit/schema.test.ts` [tests each JSON-LD builder emits required fields and valid JSON], (run by vitest)
  Layer: 4 · Depends on: `src/lib/seo/schema.ts` · Implements: Engineering_Plan §A.3 · Built by: Batch 28

`tests/unit/renderResults.test.ts` [tests rendering uses text nodes (XSS-safe) and shows buy and exact quantities], (run by vitest (jsdom))
  Layer: 7 · Depends on: `src/lib/ui/renderResults.ts` · Implements: TDD §E · Built by: Batch 55


### State and storage

`src/lib/state/migrations.ts` [upgrades stored data from older schema versions to the current one], (called by storage.ts on read)
  Layer: 3 · Depends on: `src/types/project.ts` · Implements: Backend_Schema §5 · Built by: Batch 24

`src/lib/state/projectStore.ts` [holds the project (rooms, openings, settings), enforces room limits, notifies subscribers, persists], (called by bindRoomForm.ts, renderResults.ts, unitToggle.ts)
  Layer: 3 · Depends on: `src/lib/state/storage.ts`, `src/lib/calc/validation.ts` · Implements: PRD Rule 1, 7, 9 · Built by: Batch 25

`src/lib/state/storage.ts` [safe localStorage wrapper: try/catch, schema version, JSON parse guard], (called by projectStore.ts and ThemeToggle script)
  Layer: 3 · Depends on: `src/lib/calc/errors.ts`, `src/types/project.ts` · Implements: PRD Rule 9, TDD §D.26 · Built by: Batch 24


### Styles and tokens

`src/styles/global.css` [design-token file: Tailwind import, theme tokens, dark mode values, print rules, reduced-motion], (imported by BaseLayout.astro)
  Layer: 4 · Depends on: `astro.config.ts` · Implements: Design_Brief §A.5 · Built by: Batch 26
  Model after: onwidget/astrowind (MIT; also published as arthelokyo/astrowind):src/assets/styles/tailwind.css — adapt


### SEO helpers

`src/lib/seo/meta.ts` [builds titles, descriptions and canonical URLs per page type], (called by Seo.astro and pages)
  Layer: 4 · Depends on: `src/config/site.ts` · Implements: TDD §H.56 · Built by: Batch 27

`src/lib/seo/schema.ts` [builds JSON-LD objects: WebSite, WebApplication, FAQPage, BreadcrumbList, Article], (called by Seo.astro and pages)
  Layer: 4 · Depends on: `src/config/site.ts` · Implements: TDD §H.59 · Built by: Batch 28


### Components

`src/components/ads/AdSlot.astro` [fixed-height ad container labelled Advertisement; empty until ads load], (used by pages and guides)
  Layer: 5 · Depends on: `src/config/features.ts` · Implements: PRD Rule 12 · Built by: Batch 48

`src/components/ads/AffiliateLink.astro` [affiliate link with sponsored/nofollow rel and disclosure marker], (used by ShoppingList.astro and guides)
  Layer: 5 · Depends on: `src/data/affiliates.ts`, `src/config/features.ts` · Implements: PRD Rule 15 · Built by: Batch 49

`src/components/calculators/CalculatorShell.astro` [shared wrapper for each single-material calculator page], (used by the four calculator pages)
  Layer: 5 · Depends on: `src/components/room/RoomForm.astro`, `src/components/results/ShoppingList.astro`, `src/components/common/FaqBlock.astro`, `src/components/common/Breadcrumbs.astro` · Implements: App_Flow §A.1 · Built by: Batch 51

`src/components/common/Breadcrumbs.astro` [visible breadcrumb trail matching BreadcrumbList JSON-LD], (used by calculator, guide and legal pages)
  Layer: 5 · Depends on: `src/config/site.ts` · Implements: TDD §H.59 · Built by: Batch 40

`src/components/common/ConsentButton.astro` [button that reopens the cookie preference centre], (used by Footer.astro and the cookies page)
  Layer: 5 · Depends on: `src/lib/ui/consent.ts` · Implements: PRD Rule 14 · Built by: Batch 38

`src/components/common/DisclaimerNote.astro` [accuracy disclaimer in short and full variants], (used by CalculatorShell, ShoppingList and the home page)
  Layer: 5 · Depends on: — · Implements: PRD Rule 11 · Built by: Batch 42

`src/components/common/FaqBlock.astro` [accessible FAQ accordion that also feeds FAQPage JSON-LD], (used by calculator pages and guides)
  Layer: 5 · Depends on: `src/lib/seo/schema.ts` · Implements: TDD §H.59 · Built by: Batch 41

`src/components/common/UnitSwitch.astro` [region (US/UK/CA/AU) and metric/imperial switch], (used by Header.astro; drives unitToggle.ts)
  Layer: 5 · Depends on: `src/data/regions.ts` · Implements: PRD Rule 17 · Built by: Batch 36

`src/components/layout/Footer.astro` [footer with legal links, disclosure line and ConsentButton], (used by BaseLayout.astro)
  Layer: 5 · Depends on: `src/components/common/ConsentButton.astro`, `src/config/site.ts` · Implements: PRD Rule 14–15 · Built by: Batch 39

`src/components/layout/Header.astro` [site header with logo, nav, UnitSwitch and ThemeToggle], (used by BaseLayout.astro)
  Layer: 5 · Depends on: `src/components/common/UnitSwitch.astro`, `src/components/layout/ThemeToggle.astro`, `src/config/site.ts` · Implements: App_Flow §A · Built by: Batch 37

`src/components/layout/Seo.astro` [emits title, meta, canonical, Open Graph, Twitter and JSON-LD tags], (used by BaseLayout.astro)
  Layer: 5 · Depends on: `src/lib/seo/meta.ts`, `src/lib/seo/schema.ts` · Implements: TDD §H · Built by: Batch 34

`src/components/layout/ThemeToggle.astro` [light/dark switch; light by default; remembers choice], (used by Header.astro)
  Layer: 5 · Depends on: `src/lib/state/storage.ts` · Implements: Design_Brief §B.15 · Built by: Batch 35
  Model after: onwidget/astrowind (MIT; also published as arthelokyo/astrowind):src/components/CustomStyles.astro — adapt

`src/components/results/AssumptionsPanel.astro` [expandable panel showing every default and override used], (used by ShoppingList.astro and calculator pages)
  Layer: 5 · Depends on: `src/data/materials.ts` · Implements: PRD Rule 5, NV5 · Built by: Batch 46

`src/components/results/MaterialCard.astro` [one material's result: buy quantity, exact need, pack detail, cost], (used by ShoppingList.astro)
  Layer: 5 · Depends on: `src/types/calc.ts` · Implements: PRD Rule 3, 6 · Built by: Batch 47

`src/components/results/ShoppingList.astro` [the combined shopping list container with MaterialCards, totals, print button, where-to-buy links], (used by the home and calculator pages)
  Layer: 5 · Depends on: `src/components/results/MaterialCard.astro`, `src/components/results/AssumptionsPanel.astro`, `src/components/ads/AffiliateLink.astro`, `src/components/common/DisclaimerNote.astro` · Implements: PRD Rule 1, 16 · Built by: Batch 50

`src/components/room/OpeningsFieldset.astro` [repeatable door/window rows (width, height, count)], (used by RoomForm.astro)
  Layer: 5 · Depends on: `src/types/project.ts` · Implements: PRD Rule 7 · Built by: Batch 43

`src/components/room/RoomForm.astro` [the one room input form (name, length, width, height, openings, options)], (used by home and calculator pages; wired by bindRoomForm.ts)
  Layer: 5 · Depends on: `src/components/room/OpeningsFieldset.astro` · Implements: PRD Rule 1 · Built by: Batch 44

`src/components/room/RoomList.astro` [list of added rooms with edit and remove buttons], (used by the home page; wired by bindRoomForm.ts)
  Layer: 5 · Depends on: `src/types/project.ts` · Implements: PRD Rule 1, 7 · Built by: Batch 45


### Layouts

`src/layouts/BaseLayout.astro` [page shell: head, Seo, Header, slot, Footer, global.css import, consent init script], (wraps every page)
  Layer: 6 · Depends on: `src/components/layout/Seo.astro`, `src/components/layout/Header.astro`, `src/components/layout/Footer.astro`, `src/styles/global.css` · Implements: Design_Brief §B.12 · Built by: Batch 52
  Model after: onwidget/astrowind (MIT; also published as arthelokyo/astrowind):src/layouts/PageLayout.astro — adapt

`src/layouts/GuideLayout.astro` [article layout for guides with breadcrumbs, Article JSON-LD and in-article ad slots], (used by guides/[slug].astro)
  Layer: 6 · Depends on: `src/layouts/BaseLayout.astro`, `src/components/ads/AdSlot.astro` · Implements: App_Flow §A.1 · Built by: Batch 53

`src/layouts/LegalLayout.astro` [plain layout for legal pages with no ads], (used by privacy, cookies, terms and disclaimer pages)
  Layer: 6 · Depends on: `src/layouts/BaseLayout.astro` · Implements: PRD Rule 12 · Built by: Batch 54


### Browser behaviour

`src/lib/ui/ads.ts` [loads the AdSense script only after advertising consent and fills AdSlot containers], (called by consent.ts on consent granted)
  Layer: 4 · Depends on: `src/lib/ui/consent.ts`, `src/config/features.ts` · Implements: PRD Rule 12–13 · Built by: Batch 33

`src/lib/ui/analytics.ts` [track() wrapper that does nothing unless analytics consent and the flag are on], (called by UI scripts for events listed in PRD §7)
  Layer: 4 · Depends on: `src/config/features.ts` · Implements: PRD §7 · Built by: Batch 31

`src/lib/ui/consent.ts` [initialises vanilla-cookieconsent, sets Consent Mode defaults to denied, updates on choice, exposes reopen], (called by BaseLayout script and ConsentButton)
  Layer: 4 · Depends on: `src/config/features.ts` · Implements: PRD Rule 13–14 · Built by: Batch 32
  Model after: orestbida/cookieconsent (MIT):docs (Google Consent Mode section) — copy

`src/lib/ui/dom.ts` [tiny helpers: select element, set text safely, create elements (never innerHTML with data) and install the global error handler], (imported by every UI script)
  Layer: 4 · Depends on: — · Implements: TDD §D.26 · Built by: Batch 29

`src/lib/ui/unitToggle.ts` [applies region and unit changes to the store and re-renders values], (imported by the Header script)
  Layer: 4 · Depends on: `src/lib/state/projectStore.ts`, `src/data/regions.ts` · Implements: PRD Rule 10, 17 · Built by: Batch 30

`src/lib/ui/bindRoomForm.ts` [connects the room form to the store, validates, shows field errors, triggers results], (imported by the page script on home and calculator pages)
  Layer: 7 · Depends on: `src/lib/state/projectStore.ts`, `src/lib/ui/renderResults.ts`, `src/lib/ui/dom.ts` · Implements: PRD Rule 1, 8 · Built by: Batch 56

`src/lib/ui/printList.ts` [prepares and triggers the one-page printable shopping list], (called by the print button)
  Layer: 7 · Depends on: `src/lib/ui/dom.ts` · Implements: PRD Rule 16 · Built by: Batch 57

`src/lib/ui/renderResults.ts` [renders a ShoppingList into the results container using safe DOM calls], (called by bindRoomForm.ts)
  Layer: 7 · Depends on: `src/lib/ui/dom.ts`, `src/lib/calc/index.ts` · Implements: PRD Rule 3, 6 · Built by: Batch 55


### Pages

`src/pages/404.astro` [not-found page with search-free recovery links], (served by Cloudflare Pages for unknown URLs)
  Layer: 8 · Depends on: `src/layouts/BaseLayout.astro` · Implements: TDD §G · Built by: Batch 64

`src/pages/flooring-calculator/index.astro` [flooring calculator page], (route /flooring-calculator/)
  Layer: 8 · Depends on: `src/components/calculators/CalculatorShell.astro` · Implements: App_Flow §A.1 · Built by: Batch 61

`src/pages/index.astro` [home page: hero, whole-project estimator, results, intro copy, FAQ, ad slots], (route /)
  Layer: 8 · Depends on: `src/layouts/BaseLayout.astro`, `src/components/room/RoomForm.astro`, `src/components/room/RoomList.astro`, `src/components/results/ShoppingList.astro` · Implements: App_Flow §A.1 · Built by: Batch 58

`src/pages/paint-calculator/[room].astro` [generates the four room-type paint pages from src/data/rooms.ts], (routes /paint-calculator/bedroom/, /living-room/, /kitchen/, /bathroom/)
  Layer: 8 · Depends on: `src/components/calculators/CalculatorShell.astro`, `src/data/rooms.ts` · Implements: App_Flow §A.1 · Built by: Batch 60

`src/pages/paint-calculator/index.astro` [paint calculator page], (route /paint-calculator/)
  Layer: 8 · Depends on: `src/components/calculators/CalculatorShell.astro` · Implements: App_Flow §A.1 · Built by: Batch 59

`src/pages/tile-calculator/index.astro` [tile calculator page], (route /tile-calculator/)
  Layer: 8 · Depends on: `src/components/calculators/CalculatorShell.astro` · Implements: App_Flow §A.1 · Built by: Batch 62

`src/pages/wallpaper-calculator/index.astro` [wallpaper calculator page], (route /wallpaper-calculator/)
  Layer: 8 · Depends on: `src/components/calculators/CalculatorShell.astro` · Implements: App_Flow §A.1 · Built by: Batch 63

`src/pages/about.astro` [about page], (route /about/)
  Layer: 9 · Depends on: `src/layouts/LegalLayout.astro` · Implements: App_Flow §A.1 · Built by: Batch 71

`src/pages/cookies.astro` [cookie policy with reopen-preferences button], (route /cookies/)
  Layer: 9 · Depends on: `src/layouts/LegalLayout.astro` · Implements: App_Flow §A.1 · Built by: Batch 73

`src/pages/disclaimer.astro` [accuracy, affiliate and advertising disclosure], (route /disclaimer/)
  Layer: 9 · Depends on: `src/layouts/LegalLayout.astro` · Implements: App_Flow §A.1 · Built by: Batch 75

`src/pages/guides/[slug].astro` [renders one guide from the collection], (routes /guides/<slug>/)
  Layer: 9 · Depends on: `src/layouts/GuideLayout.astro`, `src/content.config.ts` · Implements: App_Flow §A.1 · Built by: Batch 70

`src/pages/guides/index.astro` [guides index page listing all guides], (route /guides/)
  Layer: 9 · Depends on: `src/layouts/BaseLayout.astro`, `src/content.config.ts` · Implements: App_Flow §A.1 · Built by: Batch 70

`src/pages/privacy.astro` [privacy policy], (route /privacy/)
  Layer: 9 · Depends on: `src/layouts/LegalLayout.astro` · Implements: App_Flow §A.1 · Built by: Batch 72

`src/pages/terms.astro` [terms of use], (route /terms/)
  Layer: 9 · Depends on: `src/layouts/LegalLayout.astro` · Implements: App_Flow §A.1 · Built by: Batch 74


### Content

`src/content.config.ts` [defines the guides content collection and its front-matter fields], (read by Astro at build; used by guides pages)
  Layer: 9 · Depends on: `astro.config.ts` · Implements: App_Flow §A.1 · Built by: Batch 65

`src/content/guides/flooring-waste-factor.md` [guide: flooring waste factor], (rendered by guides/[slug].astro at /guides/flooring-waste-factor/)
  Layer: 9 · Depends on: `src/content.config.ts` · Implements: App_Flow §A.1 · Built by: Batch 67

`src/content/guides/how-much-paint-for-a-room.md` [guide: how much paint for a room], (rendered by guides/[slug].astro at /guides/how-much-paint-for-a-room/)
  Layer: 9 · Depends on: `src/content.config.ts` · Implements: App_Flow §A.1 · Built by: Batch 66

`src/content/guides/how-to-measure-a-room.md` [guide: how to measure a room], (rendered by guides/[slug].astro at /guides/how-to-measure-a-room/)
  Layer: 9 · Depends on: `src/content.config.ts` · Implements: App_Flow §A.1 · Built by: Batch 68

`src/content/guides/tile-layout-and-waste.md` [guide: tile layout and waste], (rendered by guides/[slug].astro at /guides/tile-layout-and-waste/)
  Layer: 9 · Depends on: `src/content.config.ts` · Implements: App_Flow §A.1 · Built by: Batch 69


### Public assets

`public/_headers` [Cloudflare Pages response headers: CSP, HSTS, frame, content-type, referrer, permissions], (served by Cloudflare Pages)
  Layer: 10 · Depends on: — · Implements: TDD §D.30–31 · Built by: Batch 76

`public/ads.txt` [AdSense seller declaration (filled once the publisher ID exists)], (served at /ads.txt)
  Layer: 10 · Depends on: — · Implements: PRD §6 · Built by: Batch 77

`public/apple-touch-icon.png` [180×180 home-screen icon], (linked by Seo.astro)
  Layer: 10 · Depends on: — · Implements: Design_Brief §A.7 · Built by: Batch 78

`public/favicon-32.png` [32×32 PNG favicon fallback], (linked by Seo.astro)
  Layer: 10 · Depends on: — · Implements: Design_Brief §A.7 · Built by: Batch 78

`public/favicon.svg` [vector favicon (tally-mark glyph)], (linked by Seo.astro)
  Layer: 10 · Depends on: — · Implements: Design_Brief §A.7 · Built by: Batch 78

`public/og-default.png` [1200×630 default social share image], (referenced by meta.ts)
  Layer: 10 · Depends on: — · Implements: TDD §H.56 · Built by: Batch 78

`public/robots.txt` [crawl rules and sitemap location], (served at /robots.txt)
  Layer: 10 · Depends on: — · Implements: TDD §H.58 · Built by: Batch 77


### End-to-end tests

`tests/e2e/calculators.spec.ts` [E2E: each calculator page gives the expected result for a known room], (run by playwright)
  Layer: 11 · Depends on: calculator pages · Implements: Engineering_Plan §A.8 · Built by: Batch 80

`tests/e2e/consent.spec.ts` [E2E: no ad/analytics requests before consent; preferences reopen from footer], (run by playwright)
  Layer: 11 · Depends on: `src/lib/ui/consent.ts` · Implements: NV2 · Built by: Batch 81

`tests/e2e/home-flow.spec.ts` [E2E: enter a room, see all four results, add a second room, print list, clear data], (run by playwright)
  Layer: 11 · Depends on: `src/pages/index.astro` · Implements: Engineering_Plan §A.8 · Built by: Batch 79

`tests/e2e/seo.spec.ts` [E2E: every page has one h1, title, description, canonical and valid JSON-LD], (run by playwright)
  Layer: 11 · Depends on: all pages · Implements: TDD §H · Built by: Batch 82


### Scripts

`scripts/check-bundle-size.mjs` [fails the build if first-party JS exceeds the budget], (called by pnpm run size and CI)
  Layer: 11 · Depends on: built `dist/` · Implements: TDD §F.46 · Built by: Batch 83

`scripts/check-seo.mjs` [scans dist/ for missing titles, descriptions, canonicals and noindex mistakes], (called by pnpm run seo:check and CI)
  Layer: 11 · Depends on: built `dist/` · Implements: TDD §H · Built by: Batch 84


### CI/CD

`.github/dependabot.yml` [weekly dependency update PRs for the npm ecosystem (pnpm lockfile) and GitHub Actions], (read by GitHub)
  Layer: 12 · Depends on: — · Implements: TDD §D.33 · Built by: Batch 87

`.github/workflows/ci.yml` [CI: install, format check, type check, unit tests, build, size and SEO checks, e2e], (runs on pull requests and pushes)
  Layer: 12 · Depends on: `package.json` · Implements: Engineering_Plan §B.12 · Built by: Batch 85

`.github/workflows/deploy.yml` [deploys dist/ to Cloudflare Pages after CI passes on main], (runs on push to main)
  Layer: 12 · Depends on: `.github/workflows/ci.yml`, `wrangler.toml` · Implements: Engineering_Plan §B.14 · Built by: Batch 86


### Documentation (provided)

`AGENTS.md` [provided documentation file for the coding agent], (read by the agent at session start / per batch (see CLAUDE.md document map))
  Layer: 0 · Depends on: — · Implements: — · Built by: Batch 1

`CLAUDE.md` [provided documentation file for the coding agent], (read by the agent at session start / per batch (see CLAUDE.md document map))
  Layer: 0 · Depends on: — · Implements: — · Built by: Batch 1

`agents/App_Flow.md` [provided documentation file for the coding agent], (read by the agent at session start / per batch (see CLAUDE.md document map))
  Layer: 0 · Depends on: — · Implements: — · Built by: Batch 1

`agents/Backend_Schema.md` [provided documentation file for the coding agent], (read by the agent at session start / per batch (see CLAUDE.md document map))
  Layer: 0 · Depends on: — · Implements: — · Built by: Batch 1

`agents/Build_prompts.md` [provided documentation file for the coding agent], (read by the agent at session start / per batch (see CLAUDE.md document map))
  Layer: 0 · Depends on: — · Implements: — · Built by: Batch 1

`agents/Design_Brief.md` [provided documentation file for the coding agent], (read by the agent at session start / per batch (see CLAUDE.md document map))
  Layer: 0 · Depends on: — · Implements: — · Built by: Batch 1

`agents/Engineering_Plan.md` [provided documentation file for the coding agent], (read by the agent at session start / per batch (see CLAUDE.md document map))
  Layer: 0 · Depends on: — · Implements: — · Built by: Batch 1

`agents/File_Map.md` [provided documentation file for the coding agent], (read by the agent at session start / per batch (see CLAUDE.md document map))
  Layer: 0 · Depends on: — · Implements: — · Built by: Batch 1

`agents/PRD.md` [provided documentation file for the coding agent], (read by the agent at session start / per batch (see CLAUDE.md document map))
  Layer: 0 · Depends on: — · Implements: — · Built by: Batch 1

`agents/TDD.md` [provided documentation file for the coding agent], (read by the agent at session start / per batch (see CLAUDE.md document map))
  Layer: 0 · Depends on: — · Implements: — · Built by: Batch 1


## 3. Coverage Cross-Check

| Source item | File_Map entry | Status |
|---|---|---|
| Backend_Schema: Project, Room, Opening, Settings | `src/types/project.ts`, `src/lib/state/storage.ts`, `src/lib/state/projectStore.ts` | covered |
| Backend_Schema: static presets (material, region, room type, affiliate) | `src/data/materials.ts`, `src/data/regions.ts`, `src/data/rooms.ts`, `src/data/affiliates.ts` | covered |
| Backend_Schema: ThemePreference | `src/components/layout/ThemeToggle.astro`, `src/lib/state/storage.ts` | covered |
| Backend_Schema: ConsentRecord (library-owned) | `src/lib/ui/consent.ts` | covered |
| TDD §B.9 validation functions | `src/lib/calc/validation.ts` | covered |
| TDD §B.9 geometry functions | `src/lib/calc/geometry.ts` | covered |
| TDD §B.9 choosePacks | `src/lib/calc/packSizes.ts` | covered |
| TDD §B.9 calculatePaint / Flooring / Tile / Wallpaper | `src/lib/calc/paint.ts`, `src/lib/calc/flooring.ts`, `src/lib/calc/tile.ts`, `src/lib/calc/wallpaper.ts` | covered |
| TDD §B.9 estimateCost, buildShoppingList | `src/lib/calc/cost.ts`, `src/lib/calc/shoppingList.ts` | covered |
| TDD §B.9 store, storage, consent, ads, track | `src/lib/state/projectStore.ts`, `src/lib/state/storage.ts`, `src/lib/ui/consent.ts`, `src/lib/ui/ads.ts`, `src/lib/ui/analytics.ts` | covered |
| TDD §C global error handler | `src/lib/ui/dom.ts` | covered |
| TDD §B.10 routes (all pages) | `src/pages/index.astro`, `src/pages/paint-calculator/index.astro`, `src/pages/paint-calculator/[room].astro`, `src/pages/flooring-calculator/index.astro`, `src/pages/tile-calculator/index.astro`, `src/pages/wallpaper-calculator/index.astro`, `src/pages/guides/index.astro`, `src/pages/guides/[slug].astro`, `src/pages/about.astro`, `src/pages/privacy.astro`, `src/pages/cookies.astro`, `src/pages/terms.astro`, `src/pages/disclaimer.astro`, `src/pages/404.astro` | covered |
| TDD §B.10 static endpoints | `public/robots.txt`, `public/ads.txt`, `astro.config.ts` | covered |
| TDD §D.31 headers | `public/_headers` | covered |
| TDD §H structured data and meta | `src/lib/seo/meta.ts`, `src/lib/seo/schema.ts`, `src/components/layout/Seo.astro` | covered |
| App_Flow guides | `src/content.config.ts`, `src/content/guides/how-much-paint-for-a-room.md`, `src/content/guides/flooring-waste-factor.md`, `src/content/guides/how-to-measure-a-room.md`, `src/content/guides/tile-layout-and-waste.md` | covered |
| App_Flow email templates | none exist (no email, PRD §9) | covered |
| TDD §B.13 background jobs | none exist at runtime (CI only: `.github/workflows/ci.yml`, `.github/dependabot.yml`) | covered |
| Design_Brief tokens file | `src/styles/global.css` | covered |
| Design_Brief components | `src/components/layout/Seo.astro`, `src/components/layout/ThemeToggle.astro`, `src/components/common/UnitSwitch.astro`, `src/components/layout/Header.astro`, `src/components/common/ConsentButton.astro`, `src/components/layout/Footer.astro`, `src/components/common/Breadcrumbs.astro`, `src/components/common/FaqBlock.astro`, `src/components/common/DisclaimerNote.astro`, `src/components/room/OpeningsFieldset.astro`, `src/components/room/RoomForm.astro`, `src/components/room/RoomList.astro`, `src/components/results/AssumptionsPanel.astro`, `src/components/results/MaterialCard.astro`, `src/components/ads/AdSlot.astro`, `src/components/ads/AffiliateLink.astro`, `src/components/results/ShoppingList.astro`, `src/components/calculators/CalculatorShell.astro` | covered |
| Design_Brief layouts | `src/layouts/BaseLayout.astro`, `src/layouts/GuideLayout.astro`, `src/layouts/LegalLayout.astro` | covered |
| Design_Brief icons and images | `public/favicon.svg`, `public/favicon-32.png`, `public/apple-touch-icon.png`, `public/og-default.png` | covered |
| Engineering_Plan test patterns | `tests/helpers/roomFixtures.ts`, `tests/helpers/storageMock.ts` | covered |
| Engineering_Plan e2e specs | `tests/e2e/home-flow.spec.ts`, `tests/e2e/calculators.spec.ts`, `tests/e2e/consent.spec.ts`, `tests/e2e/seo.spec.ts` | covered |
| Engineering_Plan CI/CD | `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `wrangler.toml`, `scripts/check-bundle-size.mjs`, `scripts/check-seo.mjs` | covered |

No ⚠ MISSING FILE.

## 4. Reuse Summary

| File | Repo:path | Use | Licence |
|---|---|---|---|
| `package.json` | onwidget/astrowind (MIT; also published as arthelokyo/astrowind):package.json | adapt | MIT |
| `astro.config.ts` | onwidget/astrowind (MIT; also published as arthelokyo/astrowind):astro.config.ts | idea-only | MIT |
| `src/config/site.ts` | onwidget/astrowind (MIT; also published as arthelokyo/astrowind):src/config.yaml | adapt | MIT |
| `src/data/materials.ts` | stoffis-git/construction-utils (MIT):README Quick Start (paint, flooring, tile helper defaults) | idea-only | MIT |
| `src/lib/calc/packSizes.ts` | phcrepaldi/Paint-Calculator (MIT):README (1 L and 5 L can splitting) | idea-only | MIT |
| `src/lib/calc/paint.ts` | stoffis-git/construction-utils (MIT):README (paint.paintGallons, primerGallons) | idea-only | MIT |
| `src/lib/calc/flooring.ts` | stoffis-git/construction-utils (MIT):README (flooring.flooringSqft, tileBoxes) | idea-only | MIT |
| `src/styles/global.css` | onwidget/astrowind (MIT; also published as arthelokyo/astrowind):src/assets/styles/tailwind.css | adapt | MIT |
| `src/components/layout/ThemeToggle.astro` | onwidget/astrowind (MIT; also published as arthelokyo/astrowind):src/components/CustomStyles.astro | adapt | MIT |
| `src/layouts/BaseLayout.astro` | onwidget/astrowind (MIT; also published as arthelokyo/astrowind):src/layouts/PageLayout.astro | adapt | MIT |
| `src/lib/ui/consent.ts` | orestbida/cookieconsent (MIT):docs (Google Consent Mode section) | copy | MIT |

## Reference Repos

| Repo | URL | License | Why it's relevant | Paths worth studying | Use |
|------|-----|---------|-------------------|----------------------|-----|
| onwidget/astrowind | https://github.com/onwidget/astrowind | MIT | Astro 7 + Tailwind CSS 4 theme with dark mode and SEO setup; also published as arthelokyo/astrowind | `src/config.yaml`, `src/components/CustomStyles.astro`, `src/assets/styles/tailwind.css`, `src/layouts/PageLayout.astro`, `src/pages/index.astro` | adapt |
| orestbida/cookieconsent | https://github.com/orestbida/cookieconsent | MIT | Consent banner and preference centre; documents Google Consent Mode integration (docs at cookieconsent.orestbida.com) | documentation site (Consent Mode section); installed from the npm registry as vanilla-cookieconsent | copy |
| stoffis-git/construction-utils | https://github.com/stoffis-git/construction-utils | MIT | Construction formula helpers (paint gallons, primer, flooring sq ft, tile boxes, drywall sheets) to cross-check our formulas | README Quick Start function list (repo file layout not verified) | idea-only |
| phcrepaldi/Paint-Calculator | https://github.com/phcrepaldi/Paint-Calculator | MIT | Small paint calculator that splits a quantity into 1 L and 5 L cans | README feature list (repo file layout not verified) | idea-only |

`copy` applies only to the cookie-consent library (installed from the npm registry, licence notice kept). Everything else is adapt or idea-only.

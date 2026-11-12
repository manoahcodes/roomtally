# Roomtally

**Measure once. Buy right.**

Roomtally is a free, private Home & Garden estimator. Enter a room once, and get one shopping list for paint, flooring, tile and wallpaper. Every purchase quantity is rounded up to real packs, with waste built in. The whole app runs in your browser.

There is no account, no server and no database. Your measurements never leave your device. Roomtally is supported by ads and affiliate links.

> **Project status:** the documentation suite is complete and the application is being built in order from `agents/Build_prompts.md`. The setup and script commands below take effect once the Batch 2 scaffold adds `package.json`.

## Why Roomtally

Most calculators answer one question. Roomtally answers the one that matters in the store aisle: how much do I buy?

- **One room, every material.** Enter length, width and height once. Paint, flooring, tile and wallpaper all use the same measurements.
- **Buy quantity first.** Each card shows the rounded-up pack quantity first, then the unrounded need beside it.
- **Multi-room totals, rounded once.** Needs are summed across rooms, then rounded up a single time.
- **Assumptions you can see and change.** Coverage, waste, pack size and price are editable and always visible.
- **A list you can take with you.** Print a one-page shopping list for the whole project.
- **Your region, your units.** US, UK, CA and AU defaults, with metric and imperial switching.
- **Private by default.** Project data lives in `localStorage` on your device. Ads and analytics load only after you consent.
- **Built for a phone.** Sized for the moment before the store trip.

## How it works

The room to results pipeline runs in six steps:

1. The form is read and converted to metres.
2. Input is validated against the numeric limits. Invalid input shows a field message and no result.
3. The room is saved to the project store.
4. The calculators run for every enabled material.
5. Needs are summed across rooms and rounded up once, to whole packs.
6. Results render as one shopping list. Costs appear only when you enter prices.

Calculation code is pure: no DOM, no storage and no globals. Stored data is treated as untrusted and validated on every read.

## Tech stack

| Layer    | Choice                                        |
| -------- | --------------------------------------------- |
| Site     | Astro 7.4.7, static output                    |
| Language | TypeScript 6.0.3 (strict)                     |
| Styles   | Tailwind CSS 4.3.5                            |
| Consent  | vanilla-cookieconsent 3.3.0                   |
| Tests    | Vitest 5.1.0, jsdom 31.0.0, Playwright 1.65.0 |
| Hosting  | Cloudflare Pages                              |
| Runtime  | Node 22.23.4                                  |
| Packages | pnpm 12.15.0                                  |

Every dependency is pinned to a specific version. TypeScript stays on 6.0.3 until `@astrojs/check` supports 7.x.

## Getting started

Requirements: Node 22.23.4 and pnpm 12.15.0, installed through Corepack.

```bash
nvm use          # reads .nvmrc
corepack enable  # activates the pnpm version pinned in package.json
pnpm install     # installs the exact pins
pnpm run dev     # starts the local dev server
```

The pnpm version is pinned in `package.json` under `packageManager`. `pnpm run build` produces the static site in `dist/`.

### Scripts

| Command                 | What it does                      |
| ----------------------- | --------------------------------- |
| `pnpm run dev`          | Start the local dev server        |
| `pnpm run build`        | Build the static site to `dist/`  |
| `pnpm run preview`      | Serve the built site locally      |
| `pnpm run check`        | Type check with `astro check`     |
| `pnpm run test`         | Run unit tests (Vitest)           |
| `pnpm run test:cov`     | Run unit tests with coverage      |
| `pnpm run test:e2e`     | Run end-to-end tests (Playwright) |
| `pnpm run format`       | Format the code with Prettier     |
| `pnpm run format:check` | Check formatting without writing  |
| `pnpm run size`         | Check the first-party JS budget   |
| `pnpm run seo:check`    | Scan `dist/` for SEO mistakes     |

## Project structure

The target layout comes from `agents/File_Map.md`:

```
├── agents/          # PRD, TDD, design, flows and build plan
├── public/          # static assets, headers, robots, ads.txt
├── scripts/         # build checks (bundle size, SEO)
├── src/
│   ├── components/  # Astro components
│   ├── data/        # material and region presets
│   ├── layouts/     # page shells
│   ├── lib/
│   │   ├── calc/    # pure calculation engine
│   │   ├── state/   # storage and project store
│   │   ├── seo/     # meta and JSON-LD builders
│   │   └── ui/      # browser scripts
│   ├── pages/       # routes
│   └── styles/      # design tokens
└── tests/           # unit and end-to-end tests
```

## Testing

- Unit tests cover the calculation engine, validation, storage and JSON-LD builders.
- jsdom tests cover the results renderer and the consent and ads behaviour.
- Playwright journeys cover the home flow, each calculator, consent and SEO.
- Coverage targets: 95% for `src/lib/calc/**`, 90% for `src/lib/state/**` and 80% overall.

```bash
pnpm run test:cov
pnpm run build && pnpm run test:e2e
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values you need. Every `PUBLIC_` variable is readable by every visitor, so never put a secret in one.

| Variable                         | Required        | Purpose                                 |
| -------------------------------- | --------------- | --------------------------------------- |
| `PUBLIC_SITE_URL`                | yes             | Canonical origin, no trailing slash     |
| `PUBLIC_ADS_ENABLED`             | no              | Master switch for ads (default `false`) |
| `PUBLIC_ADSENSE_CLIENT`          | with ads        | AdSense publisher ID                    |
| `PUBLIC_ADSENSE_SLOT_INARTICLE`  | with ads        | In-content ad unit ID                   |
| `PUBLIC_ADSENSE_SLOT_BOTTOM`     | with ads        | Bottom ad unit ID                       |
| `PUBLIC_AFFILIATES_ENABLED`      | no              | Master switch for affiliate links       |
| `PUBLIC_AFFILIATE_TAG_AMAZON_US` | with affiliates | Amazon tag for the US region            |
| `PUBLIC_AFFILIATE_TAG_AMAZON_UK` | with affiliates | Amazon tag for the UK region            |
| `PUBLIC_AFFILIATE_TAG_AMAZON_CA` | with affiliates | Amazon tag for the CA region            |
| `PUBLIC_AFFILIATE_TAG_AMAZON_AU` | with affiliates | Amazon tag for the AU region            |
| `PUBLIC_ANALYTICS_ENABLED`       | no              | Enables the custom event wrapper        |
| `PUBLIC_CF_BEACON_TOKEN`         | no              | Cloudflare Web Analytics token          |

The deploy workflow uses two GitHub secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Deployment

The site is fully static and deploys to Cloudflare Pages.

```bash
pnpm run build
pnpm exec wrangler pages deploy dist --project-name=roomtally
```

`main` deploys to production. Other branches can deploy previews. GitHub Actions runs format, type, unit, build, size, SEO and end-to-end checks on every pull request.

## Documentation

The complete specification lives in `agents/`:

| File                         | Contents                                      |
| ---------------------------- | --------------------------------------------- |
| `agents/PRD.md`              | Product rules, limits, voice and monetisation |
| `agents/TDD.md`              | Stack, routes, services, security and SEO     |
| `agents/App_Flow.md`         | Pages and user journeys                       |
| `agents/Design_Brief.md`     | Tokens, colours, components and accessibility |
| `agents/Backend_Schema.md`   | Browser-side data model and migrations        |
| `agents/Engineering_Plan.md` | Testing, CI/CD and quality gates              |
| `agents/File_Map.md`         | Every file, its purpose and connections       |
| `agents/Build_prompts.md`    | Ordered build batches and gate checks         |

## Privacy

No measurements are uploaded and no account is needed. Non-essential scripts stay off until you choose otherwise. Ads are labelled, capped and kept out of the form and results. The privacy, cookie and disclaimer pages carry the full wording.

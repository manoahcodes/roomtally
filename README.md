# Beautally

**Measure once. Buy right.**

Beautally is a free, private Home & Garden estimator. Enter a room once, and get one shopping list for paint, flooring, tile and wallpaper. Every purchase quantity is rounded up to real packs, with waste built in. The whole app runs in your browser.

There is no account, no server and no database. Your measurements never leave your device. Beautally is supported by ads and affiliate links.

> **Project status:** built in order from `agents/Build_prompts.md` (88 batches). Before you launch, run the checks in [Testing](#testing) and work through [Before you launch](#before-you-launch).

## Why Beautally

Most calculators answer one question. Beautally answers the one that matters in the store aisle: how much do I buy?

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

The layout follows `agents/File_Map.md`:

```
├── .github/         # CI and deploy workflows, Dependabot
├── agents/          # PRD, TDD, design, flows and build plan
├── public/          # favicons, OG image, _headers, robots.txt, ads.txt
├── scripts/         # build checks (bundle size, SEO)
├── src/
│   ├── components/  # Astro components (ads, calculators, common, layout, results, room)
│   ├── config/      # site constants and feature flags
│   ├── content/     # guides, written in Markdown
│   ├── data/        # material, region, room-type and affiliate presets
│   ├── layouts/     # page shells
│   ├── lib/
│   │   ├── calc/    # pure calculation engine
│   │   ├── state/   # storage and project store
│   │   ├── seo/     # meta and JSON-LD builders
│   │   └── ui/      # browser scripts
│   ├── pages/       # routes
│   ├── styles/      # design tokens
│   └── types/       # shared TypeScript types
└── tests/
    ├── e2e/         # Playwright specs
    ├── helpers/     # fixtures shared by unit tests
    └── unit/        # Vitest specs
```

### Where to find things

| I want to change...                          | Look in                                              |
| -------------------------------------------- | ---------------------------------------------------- |
| Coverage, waste or pack-size presets         | `src/data/materials.ts` (the only place they live)   |
| A calculation                                | `src/lib/calc/` (paint, flooring, tile, wallpaper)   |
| How packs are chosen and rounded             | `src/lib/calc/packSizes.ts`, `shoppingList.ts`       |
| Input limits and error codes                 | `src/lib/calc/validation.ts`, `errors.ts`            |
| Regions, currencies and units                | `src/data/regions.ts`, `src/lib/ui/unitToggle.ts`    |
| Room-type pages (bedroom, kitchen, ...)      | `src/data/rooms.ts`, `src/pages/paint-calculator/`   |
| Saving, loading and migrating a project      | `src/lib/state/`                                     |
| The form and how it reaches the results      | `src/lib/ui/bindRoomForm.ts`, `renderResults.ts`     |
| Printing                                     | `src/lib/ui/printList.ts`, print rules in `global.css` |
| A guide                                      | `src/content/guides/*.md`                            |
| Legal wording                                | `src/pages/privacy.astro`, `cookies.astro`, `terms.astro`, `disclaimer.astro` |
| Colours, fonts and spacing                   | `src/styles/global.css` (tokens)                     |
| Page titles, descriptions and JSON-LD        | `src/lib/seo/`                                       |
| Ads, consent and analytics                   | `src/lib/ui/ads.ts`, `consent.ts`, `analytics.ts`    |
| Affiliate partners and tags                  | `src/data/affiliates.ts`                             |
| Security headers and caching                 | `public/_headers`                                    |
| Site name, nav and feature flags             | `src/config/site.ts`, `features.ts`                  |

## Testing

- Unit tests cover the calculation engine, validation, storage and JSON-LD builders.
- jsdom tests cover the results renderer and the consent and ads behaviour.
- Playwright journeys cover the home flow, each calculator, consent and SEO.
- Coverage targets: 95% for `src/lib/calc/**`, 90% for `src/lib/state/**` and 80% overall.

```bash
pnpm run test:cov
pnpm exec playwright install chromium   # once, for the end-to-end tests
pnpm run build && pnpm run size && pnpm run seo:check
pnpm run test:e2e                        # starts `astro preview` on port 4321
```

The consent spec also has a branch that checks the ad script loads after "Accept all". It runs only when the site is built with `PUBLIC_ADS_ENABLED=true` and a real `PUBLIC_ADSENSE_CLIENT`. With the defaults, the same test checks that nothing loads.

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

The site is fully static and deploys to Cloudflare Pages. You can deploy by hand:

```bash
pnpm run build
pnpm exec wrangler pages deploy dist --project-name=beautally
```

For a preview of another branch, add `--branch=<branch-name>`.

### Continuous integration and deploy

- **CI** (`.github/workflows/ci.yml`) runs on every push and pull request, and weekly. It installs from the lockfile, then runs format, types, unit tests with coverage, build, size budget, SEO scan, `pnpm audit --prod --audit-level=high` and the Playwright specs. Node comes from `.nvmrc` and pnpm from `packageManager`.
- **Deploy** (`.github/workflows/deploy.yml`) runs only after a CI run on `main` that was started by a push and passed. It builds that same commit, deploys it to the `beautally` Cloudflare Pages project with `--branch=prod`, then fast-forwards the `prod` branch to that commit. `prod` is therefore always the code that is live, and the workflow creates it on the first deploy. Nobody pushes to `prod` by hand.
- **Cloudflare production branch.** In the Cloudflare dashboard open the Pages project, then Settings, Builds, Production branch, and set it to `prod`. Otherwise Cloudflare treats the deploy as a preview.
- **Dependabot** (`.github/dependabot.yml`) opens weekly pull requests for npm and GitHub Actions, with minor and patch updates grouped. Review each one by hand.

### One-time setup

1. Create a Cloudflare Pages project named `beautally` (direct upload).
2. In GitHub, add the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
3. In GitHub, add the repository variable `PUBLIC_SITE_URL` with your real address. Add the other `PUBLIC_` variables from the table above only when you need them.
4. Set the same `PUBLIC_` variables in the Cloudflare Pages project settings if you also build there.

### Rolling back

Open the project's Deployments in the Cloudflare dashboard and roll back to the previous good deployment. Or run `git revert <bad-commit>` and push to `main`; the fix deploys and `prod` follows. Nothing is stored on a server, so no data is lost.

## Before you launch

- Set `PUBLIC_SITE_URL` and `PUBLIC_CONTACT_EMAIL`, then rebuild.
- Have the About, Privacy, Cookies, Terms and Disclaimer pages reviewed by a qualified person for your country.
- If you turn ads on, add your AdSense line to `public/ads.txt` and set the ad variables.
- Turn ads and affiliates on only after the consent and disclosure wording is approved.
- Run `pnpm run build && pnpm run size && pnpm run seo:check && pnpm run test:e2e`.
- Check the CSP in `public/_headers` against any host you add, and run the preview URL through PageSpeed Insights.

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

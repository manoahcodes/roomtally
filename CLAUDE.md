> **Doc Info** — Last updated: 2026-11-12 · Reason: Switched package manager from npm to pnpm

# Roomtally — Claude Code entry file

Roomtally (working name) is a free, private, one-page Home & Garden estimator: enter a room once, get one shopping list for paint, flooring, tile and wallpaper. Stack: Astro 7.4.7 static site, TypeScript 6.0.3, Tailwind CSS 4.3.5, Vitest, Playwright, Cloudflare Pages, pnpm 12.15.0. Frontend-only; no backend (TDD §A.1).

## Document Map
| File | When to read it |
|---|---|
| `@agents/File_Map.md` | every file: purpose, connections, layer, model-after repo. Read before creating ANY file |
| `@agents/Build_prompts.md` | the ordered batches and gate checks; follow in order |
| `@agents/PRD.md` | product rules, limits, brand voice, copy rules |
| `@agents/TDD.md` | stack and exact versions, routes, services, security, errors, SEO |
| `@agents/App_Flow.md` | pages and user journeys |
| `@agents/Design_Brief.md` | colours, fonts, tokens, components, accessibility |
| `@agents/Backend_Schema.md` | the browser-side data model and migrations |
| `@agents/Engineering_Plan.md` | testing strategy, CI/CD, per-layer quality checklist |
| `@AGENTS.md` | the same rules for other agents; keep in sync with this file |

## Working Rules
1. This is a frontend-only static site. Never add a server, database, account system or API route. (TDD §B.8, PRD §9)
2. Never send measurements or personal data to any server, and never load ad or analytics scripts before consent. (PRD NV1–NV2, Rules 13–14)
3. Every purchase quantity is rounded up to whole packs, summed across rooms first and rounded once; show the buy quantity before the exact need. (PRD Rule 3, NV3)
4. Calculation code in `src/lib/calc/` is pure: no DOM, no storage, no globals. (TDD §B.14)
5. Never use `innerHTML`. Render user text only through `src/lib/ui/dom.ts`. Treat stored data as untrusted and validate it on read. (TDD §D.26, §E, Backend_Schema §4)
6. Coverage, waste and pack presets live only in `src/data/materials.ts` and every value in use must be visible in the Assumptions panel. (PRD Rule 4–5, NV5)
7. Use only the exact dependency pins in TDD §A. TypeScript stays at 6.0.3, never 7.x, until `@astrojs/check` supports it. (TDD §A.6)
8. Use only the error codes in TDD §G.48; never show stack traces or stored data in messages. (TDD §G)
9. Colours, fonts and spacing come only from the tokens in Design_Brief §A.5 (file `src/styles/global.css`). (Design_Brief §A.5)
10. Ads: max 3 per page, never in the form or results, never on legal pages, fixed reserved height, labelled Advertisement. Affiliate links use `rel="sponsored nofollow noopener"`. (PRD Rules 12, 15)
11. Use pnpm only. Commit `pnpm-lock.yaml` and never run npm or yarn. The pnpm version is pinned in `package.json` under `packageManager`. (TDD §A.1, §A.4)

## Primary Architectural Pattern
Room → Results pipeline (TDD §B.8): `bindRoomForm.ts` reads the form → `validation.ts` checks it → `projectStore.ts` saves it → `shoppingList.ts` runs the calculators and rounds up once → `renderResults.ts` draws the result with safe DOM calls.

## Build Procedure
Work through `@agents/Build_prompts.md` in order. Run each batch's gate checks. Do not move on until they pass.

## File Creation Rule
Before creating any file, find its entry in `@agents/File_Map.md` and follow its purpose and its "Model after" line. Before writing a file, read its **Model after** line in File_Map.md. If it says *copy*, you may copy and adapt it and keep the licence notice. If *adapt*, use it as the base. If *idea-only*, read it for the approach and write original code. If there is no line, write from the spec.

## Commands
```bash
nvm use                      # Node 22.23.4 from .nvmrc
corepack enable              # activates the pinned pnpm version
pnpm install                 # install exact pins
pnpm run dev                 # local dev server
pnpm run check               # astro check (types)
pnpm run test                # unit tests (vitest run)
pnpm run format:check        # prettier check
pnpm run build               # static build to dist/
pnpm run size                # JS budget check (60 KB gzip)
pnpm run seo:check           # scan dist/ for SEO mistakes
pnpm run test:e2e            # playwright (after build)
```

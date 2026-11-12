> **Doc Info** — Last updated: 2026-11-12 · Reason: Switched package manager from npm to pnpm

# Roomtally — Agent instructions (AGENTS.md)

## 1. Project Overview
Roomtally (working name) is a free, private, one-page Home & Garden estimator: enter a room once, get one shopping list for paint, flooring, tile and wallpaper. Frontend-only static site: Astro 7.4.7, TypeScript 6.0.3, Tailwind CSS 4.3.5, Vitest, Playwright, Cloudflare Pages, pnpm 12.15.0.

## 2. Where Things Are
| File | When to read it |
|---|---|
| `agents/File_Map.md` | every file: purpose, connections, layer, model-after repo. Read before creating ANY file |
| `agents/Build_prompts.md` | the ordered batches and gate checks; follow in order |
| `agents/PRD.md` | product rules, limits, brand voice, copy rules |
| `agents/TDD.md` | stack and exact versions, routes, services, security, errors, SEO |
| `agents/App_Flow.md` | pages and user journeys |
| `agents/Design_Brief.md` | colours, fonts, tokens, components, accessibility |
| `agents/Backend_Schema.md` | the browser-side data model and migrations |
| `agents/Engineering_Plan.md` | testing strategy, CI/CD, per-layer quality checklist |

## 3. How To Work
Read `agents/File_Map.md` before creating any file and follow the entry's purpose and Model-after line. Work through `agents/Build_prompts.md` in order; run each batch's gate checks and stop if one fails. Keep this file and `CLAUDE.md` consistent.

## 4. Reference-First Rule
Before writing a file, read its **Model after** line in File_Map.md. If it says *copy*, you may copy and adapt it and keep the licence notice. If *adapt*, use it as the base. If *idea-only*, read it for the approach and write original code. If there is no line, write from the spec.

## 5. Conventions and Rules
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

Naming: kebab-case pages, camelCase TS modules, PascalCase `.astro` components, UPPER_SNAKE constants. Git: branches `feat/…`, `fix/…`, `docs/…`; Conventional Commits. Imports ordered types, libraries, project modules; no default exports in `src/lib` (TDD §B.14).

## 6. Definition Of Done
Gate checks of the batch pass; unit tests pass; no secrets committed; the File_Map entry is fulfilled; no `innerHTML`; no value outside the Design_Brief tokens.

## 7. Commands
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

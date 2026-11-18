> **Doc Info** — Last updated: 2026-11-18 · Reason: "Tally & Rule" redesign — display type, motion tokens, hero sheet, shared calculator nav

# Design_Brief — Beautally

## A. Brand Identity

### A.1 Brand Name & Tagline
Beautally (working; ⚠ domain and trademark still to check). Tagline: **Measure once. Buy right.** Domain: candidate only, none confirmed.

### A.2 Brand Personality
Practical, warm, plain-spoken, dependable, tidy. Beautally feels like a knowledgeable neighbour with a tape measure: friendly, specific, never showy.

### A.3 Colour Palette
**Primary / secondary / accent**
| Name | Role | Hex | RGB | HSL |
|---|---|---|---|---|
| Clay | primary | #A8452A | 168, 69, 42 | 13, 60%, 41% |
| Sage | secondary | #4F6B4C | 79, 107, 76 | 114, 17%, 36% |
| Ochre | accent (decorative only, never text) | #D9A441 | 217, 164, 65 | 39, 67%, 55% |
| Clay dark | primary hover | #8C3720 | 140, 55, 32 | 13, 63%, 34% |

**Semantic**
| Role | Hex | Contrast on cream |
|---|---|---|
| Success | #2F6B3F | 5.92:1 |
| Warning | #8A5A00 | 5.51:1 |
| Error | #B3261E | 6.08:1 |
| Info | #2F6B8A | 5.44:1 |

**Neutral scale (lightest → darkest)**
| Stop | Hex |
|---|---|
| Cream 50 | #FBF6EE |
| Cream 100 | #F1E8DA |
| Cream 300 | #D9CCB8 |
| Ink 500 | #6B5D4D |
| Ink 700 | #4A3F34 |
| Ink 900 | #2A221B |

**Dark mode**
| Role | Hex |
|---|---|
| Dark background | #1E1914 |
| Dark surface | #2A231C |
| Dark border | #4A3F34 |
| Dark text | #F3EBDD |
| Dark muted text | #B9AB97 |
| Dark primary (Clay light) | #E8896A |
| Dark secondary (Sage light) | #9DB99A |

**Contrast checks (WCAG AA needs 4.5:1 for body text):** Clay on cream 5.50:1, Ink 900 on cream 14.53:1, Ink 500 on cream 5.92:1, Clay on Cream 100 4.87:1, dark text on dark bg 14.73:1, Clay light on dark bg 6.82:1. Ochre is never used for text.

### A.4 Typography
| Role | Family | Source | Weights |
|---|---|---|---|
| Headings | Fraunces (variable) | `@fontsource-variable/fraunces` 5.3.0, self-hosted | 600, 700 |
| Body and UI | Inter (variable) | `@fontsource-variable/inter` 5.3.0, self-hosted | 400, 500, 600 |
| Monospace | system monospace stack, no download | — | 400 |
| Level | Size | Line-height | Letter-spacing |
|---|---|---|---|
| display | clamp(2.85rem, 7vw, 5.4rem) | 0.97 | -0.035em |
| h1 | clamp(2.1rem, 4.4vw, 3.4rem) | 1.04 | -0.028em |
| h2 | clamp(1.7rem, 3.2vw, 2.5rem) | 1.1 | -0.02em |
| h3 | clamp(1.3rem, 1.9vw, 1.5rem) | 1.25 | -0.012em |
| h4 | 1.125rem | 1.35 | -0.005em |
| body-lead | clamp(1.0625rem, 0.85rem + 0.85vw, 1.25rem) | 1.55 | 0 |
| body-sm | 0.875rem | 1.5 | 0 |
| body-base | 1rem | 1.6 | 0 |
| body-lg | 1.125rem | 1.65 | 0 |
| micro | 0.75rem | 1.4 | 0.04em |

Fraunces is imported through `@fontsource-variable/fraunces/standard.css` so the optical-size axis is available; headings use `font-optical-sizing: auto`. Display sizes are fluid and clamp at both ends. Fallback stacks: Fraunces → Georgia, serif. Inter → system-ui, sans-serif.

### A.5 Design Tokens
Tokens live in **`src/styles/global.css`** (Tailwind v4 theme section; the dark values sit under the dark-theme selector).
| Token name | Value | Used for |
|---|---|---|
| color-cream-50 | #FBF6EE | page background (light) |
| color-cream-100 | #F1E8DA | cards, surfaces (light) |
| color-cream-300 | #D9CCB8 | borders, dividers (light) |
| color-ink-500 | #6B5D4D | muted text (light) |
| color-ink-700 | #4A3F34 | secondary text (light) |
| color-ink-900 | #2A221B | primary text (light) |
| color-clay-600 | #A8452A | primary buttons, links, focus ring (light) |
| color-clay-700 | #8C3720 | primary hover |
| color-sage-600 | #4F6B4C | secondary buttons, success-like accents |
| color-ochre-400 | #D9A441 | decorative highlights only |
| color-success / warning / error / info | #2F6B3F / #8A5A00 / #B3261E / #2F6B8A | messages and validation |
| color-dark-bg / surface / border | #1E1914 / #2A231C / #4A3F34 | dark theme backgrounds |
| color-dark-text / muted | #F3EBDD / #B9AB97 | dark theme text |
| color-dark-clay / sage | #E8896A / #9DB99A | dark theme primary and secondary |
| font-heading / font-body / font-mono | Fraunces / Inter / system mono | typography |
| text-display / text-h1 … text-micro | sizes per A.4 | fluid type scale |
| space-1 / 2 / 3 / 4 / 6 / 8 / 12 / 16 | 0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 / 3 / 4 rem | spacing steps |
| radius-sm / md / lg | 6px / 12px / 20px | inputs, cards, panels (mostly radius-sm) |
| shadow-sm / md | 0 1px 2px rgba(42,34,27,0.08) / 0 4px 12px rgba(42,34,27,0.12) | cards, popovers (none in dark mode; use borders) |
| shadow-paper | 0 1px 0 rgba(42,34,27,0.05), 0 26px 48px -28px rgba(42,34,27,0.4) | the one hero sheet (none in dark mode) |
| duration-fast / base / slow / reveal | 140ms / 220ms / 460ms / 620ms | feedback, state change, surfaces, scroll reveal |
| ease-standard | cubic-bezier(0.2, 0.7, 0.2, 1) | hovers, state changes |
| ease-out-expo / ease-spring | cubic-bezier(0.16, 1, 0.3, 1) / cubic-bezier(0.34, 1.3, 0.64, 1) | entrances / the hero stamp |
| rule / sheet-bg / sheet-ink / page-bg | aliases to the palette stops above | paper surfaces, in both themes |

### A.6 Logo
Concept: wordmark "Beautally" in Fraunces 700 with a tally-mark glyph (four upright strokes crossed by one diagonal) in Clay. Usage rules: minimum wordmark width 96 px, minimum glyph size 24 px; clear space equal to the height of the "R". Variants: full colour (Clay on Cream), reversed (Cream on Clay or on dark background), monochrome (Ink 900). Forbidden: stretching or skewing; recolouring outside the palette; adding shadows, gradients or outlines; placing on busy photos; rotating; swapping the typeface. Formats: SVG master, PNG fallbacks.

### A.7 Favicon & App Icon
`public/favicon.svg` (glyph, Clay on Cream, 10% safe margin); `public/favicon-32.png` 32×32; `public/apple-touch-icon.png` 180×180 with solid Cream background. 16×16 comes from the SVG. No PWA icons in v1.

### A.8 Imagery & Illustration Style
v1 has no in-page photos. Future illustration: simple line drawings of rooms in Clay and Sage strokes on Cream. Avoid: staged showroom photos, before/after beauty shots, 3D renders, stock-photo people.

### A.9 Animation & Motion Principles
Measured and editorial, not decorative. One orchestrated moment per page: on the home hero the tally marks draw, the rows settle and the "Estimate" stamp lands once (about one second in total). Everything else is quieter: 140 ms feedback, 220 ms state changes, 460 ms surface moves, 620 ms one-time scroll reveals. Ease-out-expo for arrivals, spring only for the stamp. Motion must express a cause and effect (a row being added, a disclosure opening, a link responding), never play on a loop. No parallax, no carousels, no autoplay. Static content is visible without JavaScript; `prefers-reduced-motion` renders every element in its final state.

### A.10 Brand Do's and Don'ts
| Do | Why |
|---|---|
| Show the "Buy" number large and the exact need small | the visitor's real task is the shopping trip |
| Use warm Cream backgrounds and Ink text | feels homely and keeps contrast high |
| Label ads "Advertisement" and keep them away from results | trust is the product |
| Don't | Why |
| Use bright, saturated "tool" colours or neon | clashes with the calm brand |
| Show false precision (e.g. 2.4371 cans) | estimates should look like estimates |
| Use stock-photo kitchens | feels generic and slows pages |

## B. Design System & UI Structure

### B.11 Component Library
None. Tailwind utility classes plus the in-house components below. Theming through the CSS tokens in A.5.

### B.12 Layout Patterns
Page shell in `BaseLayout.astro`: sticky header, main (max width 72rem, centred, 20 px gutters on mobile and 32 px from 640 px), footer. The home page runs hero (7/5 columns from 1024 px) → material index → estimator → how it works → why the list adds up → calculators → FAQ, with ads only outside the form and results. Calculator pages: ruled page head with a material stamp, shared calculator nav, then form and results in two columns from 1024 px. Guides and legal pages use a 48 rem reading measure. Breakpoints 640 / 768 / 1024 / 1280 px. Header nav collapses to a native `<details>` panel below 1024 px, with a second region/unit switch inside it. No horizontal scroll at any width.

### B.13 Key Reusable Components
| Component | Props (name: type) | Purpose | Used on | File |
|---|---|---|---|---|
| Seo | title: string, description: string, canonical: string, ogImage?: string, jsonLd?: object[] | head tags | every page via BaseLayout | `src/components/layout/Seo.astro` |
| ThemeToggle | none | light/dark switch | Header | `src/components/layout/ThemeToggle.astro` |
| UnitSwitch | none | region and units | Header | `src/components/common/UnitSwitch.astro` |
| Header | none | site header | BaseLayout | `src/components/layout/Header.astro` |
| ConsentButton | label?: string | reopen consent centre | Footer, cookies page | `src/components/common/ConsentButton.astro` |
| Footer | none | legal links, disclosure | BaseLayout | `src/components/layout/Footer.astro` |
| Breadcrumbs | items: {name: string, href: string}[] | breadcrumb trail | all but home | `src/components/common/Breadcrumbs.astro` |
| MaterialIcon | name: "paint"…"check", class?: string, size?: number | one 1.5 px icon family | home, calculators, footer | `src/components/common/MaterialIcon.astro` |
| CalculatorNav | current?: string | shared four-material navigation | calculator pages | `src/components/calculators/CalculatorNav.astro` |
| HeroSheet | none | the animated example shopping list | home | `src/components/home/HeroSheet.astro` |
| FaqBlock | items: {q: string, a: string}[] | FAQ accordion | calculators, guides, home | `src/components/common/FaqBlock.astro` |
| DisclaimerNote | variant: "short" or "full" | accuracy note | results, calculator pages | `src/components/common/DisclaimerNote.astro` |
| OpeningsFieldset | none | door/window rows | RoomForm | `src/components/room/OpeningsFieldset.astro` |
| RoomForm | mode: "project" or "single", material?: string, preset?: object | the room input form | home, calculators | `src/components/room/RoomForm.astro` |
| RoomList | none | rooms with edit/remove | home | `src/components/room/RoomList.astro` |
| AssumptionsPanel | material?: string | defaults and overrides | results, calculators | `src/components/results/AssumptionsPanel.astro` |
| MaterialCard | material: string, title: string | one material's result | ShoppingList | `src/components/results/MaterialCard.astro` |
| AdSlot | slotKey: "inarticle" or "bottom", minHeight: number | labelled fixed-height ad container | home, calculators, guides | `src/components/ads/AdSlot.astro` |
| AffiliateLink | partnerId: string, category: string, label: string | sponsored link | ShoppingList, guides | `src/components/ads/AffiliateLink.astro` |
| ShoppingList | mode: "project" or "single", material?: string | combined results container | home, calculators | `src/components/results/ShoppingList.astro` |
| CalculatorShell | title: string, intro: string, material: string, faq: object[] | wrapper for calculator pages | four calculator pages | `src/components/calculators/CalculatorShell.astro` |

### B.14 Primary UI Pattern
Progressive enhancement. 1) The server-built page contains the form and empty results container. 2) A page script calls `bindRoomForm`. 3) Valid input updates the store and re-renders results through safe DOM calls. Files: `bindRoomForm.ts`, `projectStore.ts`, `renderResults.ts`.

### B.15 Dark Mode Strategy
Light is the default for everyone, regardless of system setting. The toggle sets `data-theme` on the html element and saves `beautally:theme`. A tiny inline script in `BaseLayout.astro` applies the saved theme before first paint to prevent a flash. Dark values are the tokens in A.3 and A.5.

### B.16 Interaction & Animation Guidelines
Hover darkens Clay to Clay 700; list rows tint and their arrow advances 5 px. Buttons press to 0.985 scale without moving layout. Focus is always a 3 px Clay ring with a 2 px offset. Results update in place, keyed by material, so a price field keeps its value and focus; newly inserted rows settle with `@starting-style`. Scroll reveals are one-time and only on static sections, never on the form or results. Ad containers keep their reserved height. All motion stops under `prefers-reduced-motion`, and `html.reveal-ready` is the only thing that hides a reveal element, so blocked scripts cannot hide content.

### B.17 Accessibility Standards
Target WCAG 2.2 AA. Every input has a visible label; errors are linked with `aria-describedby`; results container uses `aria-live="polite"`; full keyboard operation; touch targets ≥ 44 px; colour never the only signal; reduced-motion respected.

### B.18 UX Principles
1. Never lose the visitor's saved rooms silently. 2. Always show the buy quantity before the exact quantity. 3. Never show a result for bad input; say what to fix. 4. Show every assumption used. 5. Keep ads away from inputs and results.

## C. Reference Repos
| Repo | URL | License | Why it's relevant | Paths worth studying | Use |
|------|-----|---------|-------------------|----------------------|-----|
| onwidget/astrowind | https://github.com/onwidget/astrowind | MIT | Astro 7 + Tailwind CSS 4 theme with dark mode and SEO setup; also published as arthelokyo/astrowind | `src/config.yaml`, `src/components/CustomStyles.astro`, `src/assets/styles/tailwind.css`, `src/layouts/PageLayout.astro`, `src/pages/index.astro` | adapt |
| orestbida/cookieconsent | https://github.com/orestbida/cookieconsent | MIT | Consent banner and preference centre; documents Google Consent Mode integration (docs at cookieconsent.orestbida.com) | documentation site (Consent Mode section); installed from the npm registry as vanilla-cookieconsent | copy |

No verified reference for an Astro calculator UI; build from the spec.

> **Doc Info** — Last updated: 2026-11-12 · Reason: Switched package manager from npm to pnpm

# App_Flow — Roomtally

## A. Pages

### A.1 Public Pages
| URL | Page | Purpose | Key elements | SEO priority |
|---|---|---|---|---|
| / | Home estimator | whole-project tool | hero (PRD §12), RoomForm, RoomList, ShoppingList, FAQ, 2 ad slots | High |
| /paint-calculator/ | Paint calculator | single-material page | CalculatorShell, assumptions, FAQ, 2 ad slots | High |
| /paint-calculator/bedroom/ | Bedroom paint | long-tail page | preset 4×3.5 m room, copy, FAQ | High |
| /paint-calculator/living-room/ | Living room paint | long-tail page | preset room, copy, FAQ | High |
| /paint-calculator/kitchen/ | Kitchen paint | long-tail page | preset room, copy, FAQ | High |
| /paint-calculator/bathroom/ | Bathroom paint | long-tail page | preset room, copy, FAQ | High |
| /flooring-calculator/ | Flooring calculator | single-material page | lay-pattern choice, box size, FAQ | High |
| /tile-calculator/ | Tile calculator | single-material page | tile size, grout gap, surface choice, FAQ | High |
| /wallpaper-calculator/ | Wallpaper calculator | single-material page | roll size, pattern repeat, FAQ | Medium |
| /guides/ | Guides index | hub for guides | four guide cards | Medium |
| /guides/how-much-paint-for-a-room/ | Guide | evergreen article | worked example, link to calculator, 2 ad slots, FAQ | High |
| /guides/flooring-waste-factor/ | Guide | evergreen article | same pattern | High |
| /guides/how-to-measure-a-room/ | Guide | evergreen article | same pattern | Medium |
| /guides/tile-layout-and-waste/ | Guide | evergreen article | same pattern | Medium |
| /about/ | About | trust, who and why | short story, contact note | Low |
| /privacy/ | Privacy policy | what is and isn't collected | plain-language text, no ads | Low |
| /cookies/ | Cookie policy | categories and reopen button | ConsentButton, no ads | Low |
| /terms/ | Terms of use | usage terms | text, no ads | Low |
| /disclaimer/ | Disclaimer | accuracy, affiliate, ad disclosure | text, no ads | Low |

### A.2 Auth Pages
N/A: no accounts.

### A.3 App Pages (behind auth)
N/A: every page is public.

### A.4 Admin Pages
N/A: no admin; content changes are code changes through Git.

### A.5 Error Pages
| Page | Shows | Recovery |
|---|---|---|
| 404 (`src/pages/404.astro`) | "We couldn't find that page." | links to home, the four calculators and guides |
| 500, 403, maintenance | N/A for a static site (Cloudflare serves its own edge errors) | — |

### A.6 Page-Level SEO
Title, description, OG and canonical patterns are defined once in TDD §H.56; every page above follows them. OG image: the single default image `public/og-default.png`.

## B. User Flows

### B.7 Critical User Journeys

**Journey 1 — First visit to shopping list (primary value)**
1. Land on `/` → read hero → focus the first field.
2. Enter length, width, height (optional doors/windows).
   - *Error branch:* value outside limits → field message with code (e.g. CALC_001); no results shown.
   - *Error branch:* openings bigger than the walls → CALC_002 message.
3. Results appear instantly: one card per material, "Buy" quantity first, exact need second.
4. Optionally open the Assumptions panel and change a default (e.g. 3 coats).
5. Click "Add another room" or "Print my list".
   - *Abandonment:* leaves at any step → nothing was sent; rooms stay in this browser.
6. Next visit: saved rooms reload (if storage allowed).
   - *Branch:* storage blocked → info note STO_001, works from memory.

**Journey 2 — Search landing on a room-type page**
1. Arrive from search on `/paint-calculator/bedroom/` → see a preset bedroom already filled.
2. Edit the sizes → paint result updates.
3. Click "Add to my whole project" → goes to `/` with the room saved.
   - *Abandonment:* reads the answer and leaves (acceptable; ads and the guide link serve this visitor).

**Journey 3 — Consent decision**
1. First page load → banner appears (advertising and analytics denied by default).
2. Choose "Accept all", "Reject non-essential" or "Manage preferences".
3. Accepted → ad script loads (`loadAds`); rejected → no ad or analytics script, page unchanged.
4. Later: footer "Cookie preferences" reopens the centre and the choice can be changed.
   - *Error branch:* consent library fails to load (CNS_001) → non-essential stays off, no banner error shown.

**Journey 4 — Recovery from bad stored data**
1. Visitor (or an extension) corrupts the saved project.
2. On load, `readProject` fails validation → project resets (STO_002) → friendly note "We reset your saved rooms because they could not be read."
3. Visitor re-enters the room; flow continues as Journey 1.

## C. Email Flows
N/A. The site has no accounts, no email capture and sends no email (PRD §9). Sections C.8–C.15 of the spec (provider, sender identity, catalogue, sending service, unsubscribe, bounces, preview, templates) have nothing to document. If email capture is added later, run Fragment B (module add).

## D. Reference Repos
| Repo | URL | License | Why it's relevant | Paths worth studying | Use |
|------|-----|---------|-------------------|----------------------|-----|
| onwidget/astrowind | https://github.com/onwidget/astrowind | MIT | Astro 7 + Tailwind CSS 4 theme with dark mode and SEO setup; also published as arthelokyo/astrowind | `src/config.yaml`, `src/components/CustomStyles.astro`, `src/assets/styles/tailwind.css`, `src/layouts/PageLayout.astro`, `src/pages/index.astro` | adapt |

No verified reference for flows or email; write from the spec.

> **Doc Info** — Last updated: 2026-11-12 · Reason: Switched package manager from npm to pnpm

# PRD — Roomtally (working name) — Home Project Estimator

## 1. Product Vision
Homeowners and DIYers guess how much paint, flooring, tile and wallpaper to buy, and either run short mid-job or overbuy. Roomtally is a free, private, one-page website where you enter a room once and get a single shopping list for every material, rounded up to real pack sizes (cans, boxes, rolls) with waste built in. It runs entirely in the browser and earns from ads and affiliate links.

## 2. Target Audience
- **Primary persona — "First-time room refresher" (US/UK/CA/AU, 25–55):** about to repaint or refloor one or two rooms, not a professional, searches on a phone before going to the store, wants one number to write on a list.
- **Secondary persona — "Weekend renovator":** doing several rooms and several materials, wants multi-room totals, printable list, and control over waste and coverage.

## 3. Core Features (priority order)
1. **One room entry feeding every material** — serves both personas.
2. **Shopping list with pack sizes** (buy quantity first, exact need second) — both.
3. **Multi-room project totals** (rounded up once, after summing) — secondary.
4. **Four single-material calculator pages** (paint, flooring, tile, wallpaper) for search traffic — primary.
5. **Assumptions panel with editable defaults** (coverage, waste, pack size, price) — secondary.
6. **Cost estimate from user-supplied prices** — both.
7. **Printable one-page list** — both.
8. **Region and unit switch** (US, UK, CA, AU; metric/imperial) — both.
9. **Guides** (four evergreen articles) — primary, for search and trust.

## 4. Business Rules
- **Rule 1:** One room entry feeds all four calculators; the user never re-enters dimensions.
- **Rule 2:** All calculation runs in the browser. No measurement leaves the device.
- **Rule 3:** Every purchase quantity is rounded UP to whole packs; the exact unrounded need is shown beside it.
- **Rule 4:** Default presets (all overridable, all shown in the Assumptions panel):

| Material | Default |
|---|---|
| Paint | 350 sq ft per US gallon per coat (imperial); 10 m² per litre per coat (metric); 2 coats; ceiling off; primer off; 5% spare |
| Flooring | waste 10% straight, 15% diagonal, 20% herringbone; box covers 20 sq ft (imperial) or 2 m² (metric) |
| Tile | waste 10% straight, 15% diagonal, 20% herringbone; tile 12×12 in or 300×300 mm; grout gap 1/8 in or 3 mm; box covers 10 sq ft or 1 m² |
| Wallpaper | roll 20.5 in × 33 ft (imperial) or 0.53 m × 10.05 m (metric); pattern repeat 0 (plain), choices 16/32/64 cm; 10% spare. ⚠ VERIFY roll sizes against current retailer specs before launch |

- **Rule 5:** The user can override every default; overrides appear in the Assumptions panel.
- **Rule 6:** Cost appears only when the user enters a price per unit, and is labelled "estimate".
- **Rule 7:** Input limits: room length and width 0.5–100 m (1.6–328 ft); ceiling height 1.5–6 m (5–20 ft); max 10 rooms per project; max 20 openings per room; paint coats 1–4; waste 0–30%; price 0–100,000 per unit.
- **Rule 8:** Invalid input never produces a result; the field shows its message and error code.
- **Rule 9:** Project data lives only in the browser's localStorage under one key; "Clear my data" deletes it.
- **Rule 10:** Metric/imperial switching converts displayed values; the stored canonical unit is metres.
- **Rule 11:** Every result shows the accuracy note: estimates only, check the manufacturer's coverage, buy from one batch.
- **Rule 12:** Max 3 ad units per page; none inside the input form or results card; none on legal pages; every ad container reserves a fixed height; every ad is labelled "Advertisement".
- **Rule 13:** Ad and non-essential scripts load only after the visitor's consent choice.
- **Rule 14:** Advertising and analytics categories are denied until accepted; Consent Mode signals default to denied; the preference centre is reachable from the footer on every page.
- **Rule 15:** Affiliate links carry `rel="sponsored nofollow noopener"` and appear only in the results "Where to buy" area and in guides, with a disclosure on the page.
- **Rule 16:** Any result can be printed as a one-page shopping list.
- **Rule 17:** Region (US, UK, CA, AU) sets default units, currency and wording, never the maths.
- **Rule 18:** Content pages are readable without JavaScript; calculators show a "needs JavaScript" message instead.

**Never violate**
- **NV1:** Never send measurements or any personal data to a server.
- **NV2:** Never load ad or analytics scripts before consent.
- **NV3:** Never show a non-rounded-up number as the "buy" quantity.
- **NV4:** Never show a result for invalid input.
- **NV5:** Never apply a coverage or waste value the user cannot see in the Assumptions panel.
- **NV6:** Never style an ad so it could be mistaken for part of the result.

## 5. Pricing Tiers
| Tier | Price | Key limits | Features |
|---|---|---|---|
| Free (only tier) | $0 | 10 rooms per project; 20 openings per room; 4 coats; 30% waste | All calculators, assumptions editing, print, region switch. No accounts, no paid plan. |

## 6. Plan Enforcement & Monetization Rules
| Limit | Enforcing function | On exceed |
|---|---|---|
| Dimension ranges (Rule 7) | `validateRoomInput` in `src/lib/calc/validation.ts` | throws CalcValidationError CALC_001 (or CALC_007 for empty/NaN) |
| Openings count and area | `validateOpenings` | CALC_008 (count), CALC_002 (area exceeds wall) |
| Max 10 rooms | `addRoom` in `src/lib/state/projectStore.ts` | CALC_003, room not added |
| Coats 1–4 | `validatePaintOptions` | CALC_004 |
| Waste 0–30% | `validateWaste` | CALC_005 |
| Price 0–100,000 | `validatePrice` | CALC_006 |
| Max 3 ad units per page | `loadAds` in `src/lib/ui/ads.ts` (counts containers, fills first 3) | extra containers stay empty |
| Ads only after consent | `loadAds` / `initConsent` | nothing injected; no error shown |

Monetization order: Google AdSense first (needs an approved publisher ID; `public/ads.txt` stays a comment until then), affiliate links second. ⚠ MISSING: approved affiliate programs per region (Amazon Associates exists in all four regions, but approval and program terms are the owner's to confirm; store-specific programs unverified).

## 7. Analytics Events
Pageviews come from Cloudflare Web Analytics (cookieless). Custom events go through `track()` and stay off until the flag and consent are on.

| Event | Trigger | Properties |
|---|---|---|
| `first_room_entered` | first valid room saved in a session (first meaningful action) | region, unit system |
| `shopping_list_viewed` | results rendered | materials shown, room count |
| `room_added` | additional room saved | room count |
| `list_printed` | print button used | room count |
| `affiliate_click` | affiliate link clicked | partner id, category |
| `unit_changed` | unit or region switched | from, to |
| `consent_updated` | consent saved | analytics, advertising (booleans) |
| `data_cleared` | "Clear my data" used | — |

Signup, upgrade and cancellation events do not exist: there are no accounts or paid plans.

## 8. Competitive Positioning
| Competitor | Their strength | Our differentiator |
|---|---|---|
| Omni Calculator (paint calculator and 29 similar home and garden calculators) | Trusted brand, huge calculator catalogue, strong search presence | One shared room entry and one combined list; they are single-purpose |
| CalcReno | Free paint, tile, flooring, concrete, wallpaper and renovation-cost tools for US homeowners | Region and unit switch (UK/CA/AU), pack-size rounding shown beside exact need |
| DIYdigits | Very wide project range (landscaping, concrete, fencing), no signup | We are narrower on purpose (interior finishes) but give a project-level list |
| HomeCalcTool | Paint, flooring, tile, concrete, gravel, mulch and more, free, no signup | Same: project-level list and print |
| Hub sites such as squarefootagecalculator.pages.dev | Already offer multi-room totals and printable shopping lists | **Honest note:** our differentiation is narrow; we win only through speed, clarity, pack-size logic and search coverage, not a unique feature |
| Retailer calculators (assumed, not verified here) | Tied to the store's products | Store-neutral, no product push |

## 9. MVP Scope
**In:** home page estimator; four calculator pages; four room-type paint pages; four guides; about and four legal pages; assumptions panel; multi-room (max 10); region/unit switch; light/dark mode; print; consent banner; AdSense wiring; affiliate wiring (off until programs approved); sitemap; schema.
**Not in v1 (out of scope):** accounts, email capture, saving to a server, sharing links, concrete/mulch/gravel/fencing calculators, non-English languages, mobile app, product database or live prices, room shapes other than rectangles (L-shapes are handled by adding two rooms and are explained in the guide).

## 10. Brand Identity & Positioning
- **Name (working):** Roomtally. Alternatives considered: Onceover, Plankwise. A search found no calculator site under Roomtally or Onceover, but that is not proof it is free: ⚠ domain and trademark checks still to do.
- **Tagline:** "Measure once. Buy right."
- **Brand story:** Roomtally was built for the moment you stand in a hardware store aisle and cannot remember whether you needed two cans or three. Measure the room once, and the list you carry in is already right, rounded to the packs on the shelf.
- **Personality:** practical, warm, plain-spoken, dependable, tidy.

## 11. Brand Voice & Tone
Voice (always): clear, friendly, practical, no jargon. Tone shifts by context: encouraging on the form, calm and specific on errors, brisk on results, plain and careful in legal pages.

| Do this | Not this |
|---|---|
| "You need 3 cans. The exact amount is 2.4." | "Optimal paint procurement quantity: 2.4 units." |
| "That room looks very large. Check the length is in metres." | "Invalid input." |
| "Round up, then check the label on your paint." | "Our proprietary engine guarantees perfect accuracy." |

## 12. Messaging Hierarchy
- **Primary value proposition (hero headline):** Enter your room once and get everything you need to buy.
- **Secondary (sub-headline):** Paint, flooring, tile and wallpaper in one shopping list, with pack sizes and waste built in.
- **Proof points:** (1) One measurement powers all four calculators. (2) Rounds up to real cans, boxes and rolls. (3) Private: nothing leaves your browser, no sign-up.

## 13. Copywriting Rules
- Max sentence length: 20 words.
- Forbidden words: leverage, seamless, cutting-edge, revolutionary, unlock, game-changing, supercharge, state-of-the-art, "perfect" and "exact" as claims about accuracy.
- CTA buttons: verb first, 4 words or fewer: "Calculate my list", "Add another room", "Print my list", "Clear my data".
- Use "estimate", never "guarantee".

## 14. Channel Strategy & Launch Messaging
| Channel | Message |
|---|---|
| Search (primary) | Long-tail pages: "How much paint for a [room]?", flooring waste, tile counts |
| Pinterest | Pins of the printable shopping list for common room sizes |
| Reddit home-improvement communities | Answer real questions with the guide; follow each community's self-promotion rules |

**Launch hero:** "Enter your room once and get everything you need to buy." · **Sub:** "Paint, flooring, tile and wallpaper in one shopping list, with pack sizes and waste built in." · **CTA:** "Calculate my list"

## Reference Repos

| Repo | URL | License | Why it's relevant | Paths worth studying | Use |
|------|-----|---------|-------------------|----------------------|-----|
| stoffis-git/construction-utils | https://github.com/stoffis-git/construction-utils | MIT | Construction formula helpers (paint gallons, primer, flooring sq ft, tile boxes, drywall sheets) to cross-check our formulas | README Quick Start function list (repo file layout not verified) | idea-only |
| phcrepaldi/Paint-Calculator | https://github.com/phcrepaldi/Paint-Calculator | MIT | Small paint calculator that splits a quantity into 1 L and 5 L cans | README feature list (repo file layout not verified) | idea-only |

Both are formula references only; verify every formula with our own hand-calculated tests.

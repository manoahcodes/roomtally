> **Doc Info** — Last updated: 2026-11-12 · Reason: Switched package manager from npm to pnpm

# Backend_Schema — Roomtally

**There is no server and no database.** This file defines the *client-side data model*: what is stored in the visitor's browser (localStorage) and the static data tables shipped in the code. Nothing here is ever sent to a server (PRD NV1).

## 1. Entity Overview
| Entity | Where it lives | Description |
|---|---|---|
| Project | localStorage key `roomtally:project:v1` | The visitor's rooms and settings (one per browser) |
| Room | inside Project | One rectangular room with dimensions and options |
| Opening | inside Room | A door or window to subtract from wall area |
| Settings | inside Project | Region, unit system, per-material overrides and prices |
| ThemePreference | localStorage key `roomtally:theme` | `light` or `dark` (light default) |
| ConsentRecord | cookie `cc_cookie` (owned by vanilla-cookieconsent) | Stores the visitor's consent choices; first-party, necessary |
| MaterialPreset | `src/data/materials.ts` (static) | Default coverage, waste, pack sizes |
| RegionPreset | `src/data/regions.ts` (static) | Units, currency, wording per region |
| RoomTypePreset | `src/data/rooms.ts` (static) | Typical sizes and copy for room-type pages |
| AffiliatePartner | `src/data/affiliates.ts` (static) | Partner table |

## 2. Full Schema
All lengths stored in metres, areas in m², prices as plain numbers in the region currency. Every stored record has `createdAt` and `updatedAt` (ISO 8601 strings); `updatedAt` changes on every write.

**Project** (single JSON document)
| Field | Type | Default | Nullable | Constraints | Index |
|---|---|---|---|---|---|
| schemaVersion | integer | 1 | no | must equal current version after migration | — |
| rooms | Room[] | [] | no | max 10 items | — |
| settings | Settings | defaults | no | — | — |
| createdAt | string (ISO) | now | no | — | — |
| updatedAt | string (ISO) | now | no | — | — |

**Room**
| Field | Type | Default | Nullable | Constraints | Index |
|---|---|---|---|---|---|
| id | string | generated | no | unique within project | by id |
| name | string | "Room 1" | no | 1–40 chars, shown as text only | — |
| lengthM | number | — | no | 0.5–100 | — |
| widthM | number | — | no | 0.5–100 | — |
| heightM | number | 2.4 | no | 1.5–6 | — |
| openings | Opening[] | [] | no | max 20; total area < gross wall area | — |
| paint | PaintOptions | defaults | no | coats 1–4; wasteSparePct 0–30 | — |
| flooring | FlooringOptions | defaults | no | layPattern in straight/diagonal/herringbone; boxCoverageM2 > 0 | — |
| tile | TileOptions | defaults | no | tileWidthM, tileHeightM > 0; groutM 0–0.02; surface floor/wall | — |
| wallpaper | WallpaperOptions | defaults | no | rollWidthM, rollLengthM > 0; repeatM 0–0.9 | — |
| createdAt, updatedAt | string | now | no | — | — |

**Opening**
| Field | Type | Default | Nullable | Constraints | Index |
|---|---|---|---|---|---|
| id | string | generated | no | unique within room | — |
| kind | enum | door | no | door or window | — |
| widthM | number | 0.9 | no | 0.2–5 | — |
| heightM | number | 2.0 | no | 0.2–3 | — |
| count | integer | 1 | no | 1–10 | — |

**Settings**
| Field | Type | Default | Nullable | Constraints | Index |
|---|---|---|---|---|---|
| region | enum | from browser locale, else US | no | US, UK, CA, AU | — |
| unitSystem | enum | from region | no | metric or imperial | — |
| includeCeiling | boolean | false | no | — | — |
| includePrimer | boolean | false | no | — | — |
| prices | map (material → number) | empty | yes | each 0–100,000 | — |
| overrides | map (preset id → number) | empty | yes | each > 0, bounded per field | — |

**Static presets** are plain typed tables: MaterialPreset (id, label, value, unit, sourceNote), RegionPreset (code, unitSystem, currency, locale, terminology), RoomTypePreset (slug, typical length/width/height, intro, three FAQs), AffiliatePartner (id, name, category, urlTemplate, tagEnvVar, enabled).

## 3. Relationship Diagram
```
Project 1 ──< Room 1 ──< Opening
Project 1 ── 1 Settings
(static) MaterialPreset / RegionPreset  ──read by──>  calculators + forms
(static) RoomTypePreset  ──read by──>  /paint-calculator/[room]/ pages
(static) AffiliatePartner ──read by──> results "Where to buy"
```

## 4. Multi-Tenancy Isolation
Not applicable: no accounts, no server, no tenants. Isolation is the browser's own per-origin storage. Tamper-resistance Pattern Spec:

**Pattern: Treat stored data as untrusted input**
Implemented in: `src/lib/state/storage.ts` → `readProject`
Behaviour: 1) read the key inside try/catch (failure → STO_001, continue in memory); 2) parse JSON inside try/catch; 3) run migrations; 4) validate every field against the constraints above using `validation.ts`; 5) on any failure reset to an empty project (STO_002).
Inputs / outputs: raw string in, valid Project out; never throws to the UI.
Must never: render stored text as HTML, or feed an unvalidated number into a calculator.

## 5. Migration Strategy
- Version 1 is the first schema; `schemaVersion` is stored in the document.
- Creation order is irrelevant (no foreign keys). Migrations live in `src/lib/state/migrations.ts` as an ordered list from version N to N+1; each is tested.
- A stored version newer than the code knows is not migrated down: reset to empty (STO_002).
- Rollback: deploying an older site version after a schema bump triggers the reset path; accepted loss is one visitor's saved rooms. No seed data.

## 6. Indexes & Performance Notes
No indexes (single document, ≤ 10 rooms). Stored size stays under 50 KB; writes happen on valid change, debounced 300 ms.

## 7. Data Retention Policy
Data stays in the browser until the visitor clicks "Clear my data" or clears site data. Nothing is soft- or hard-deleted server-side because nothing is stored server-side. Cloudflare Web Analytics keeps aggregate, cookieless pageview stats under Cloudflare's own policy.

## Reference Repos

None verified. No verified reference repo exists for a browser-only data model; write from the spec.

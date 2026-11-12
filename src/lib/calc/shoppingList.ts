import type {
  AssumptionLine,
  MaterialKey,
  MaterialNeed,
  ShoppingList,
} from '../../types/calc';
import type { Project, Room, Settings } from '../../types/project';
import { estimateCost, totalCost } from './cost';
import { CalcValidationError } from './errors';
import { flooringNeed } from './flooring';
import { paintNeeds } from './paint';
import { resultFromNeed } from './packSizes';
import { tileNeed } from './tile';
import { L_PER_US_GAL, m2ToSqFt, mToFt, mToIn, litresToUsGal, roundTo } from './units';
import { LIMITS, validateRoom, validateSettings } from './validation';
import { wallpaperNeed } from './wallpaper';

const ORDER: readonly MaterialKey[] = [
  'paint',
  'ceilingPaint',
  'primer',
  'flooring',
  'tile',
  'wallpaper',
];

/** Unrounded needs for one room, for the materials the visitor turned on. */
function needsForRoom(room: Room, settings: Settings): MaterialNeed[] {
  const needs: MaterialNeed[] = [];
  const enabled = new Set(settings.enabledMaterials);
  if (enabled.has('paint')) {
    const paint = paintNeeds(room, {
      includeCeiling: settings.includeCeiling,
      includePrimer: settings.includePrimer,
    });
    needs.push(paint.wall);
    if (paint.ceiling) needs.push(paint.ceiling);
    if (paint.primer) needs.push(paint.primer);
  }
  if (enabled.has('flooring')) needs.push(flooringNeed(room));
  if (enabled.has('tile')) needs.push(tileNeed(room));
  if (enabled.has('wallpaper')) needs.push(wallpaperNeed(room));
  return needs;
}

/** Add the needs of every room per material. Nothing is rounded here (PRD Rule 3). */
function sumNeeds(all: MaterialNeed[]): MaterialNeed[] {
  const byKey = new Map<MaterialKey, MaterialNeed>();
  for (const need of all) {
    const existing = byKey.get(need.key);
    if (!existing) {
      byKey.set(need.key, { ...need, packSizes: [...need.packSizes] });
      continue;
    }
    existing.exactQuantity += need.exactQuantity;
    if (need.tilesNeeded !== undefined) {
      existing.tilesNeeded = (existing.tilesNeeded ?? 0) + need.tilesNeeded;
    }
    // Floor and wall tile in one list share a plain label.
    if (existing.label !== need.label && need.key === 'tile') existing.label = 'Tile';
  }
  return ORDER.flatMap((key) => {
    const need = byKey.get(key);
    return need ? [need] : [];
  });
}

const n = (value: number, decimals = 2): string => String(roundTo(value, decimals));

function packsLabel(sizesL: readonly number[], imperial: boolean): string {
  const sorted = [...sizesL].sort((a, b) => a - b);
  return imperial
    ? `${sorted.map((s) => n(litresToUsGal(s))).join(', ')} US gal`
    : `${sorted.map((s) => n(s)).join(', ')} L`;
}

function area(m2: number, imperial: boolean): string {
  return imperial ? `${n(m2ToSqFt(m2))} sq ft` : `${n(m2)} m²`;
}

function lengthMm(m: number, imperial: boolean): string {
  return imperial ? `${n(mToIn(m), 3)} in` : `${n(m * 1000)} mm`;
}

function roomAssumptions(room: Room, settings: Settings): Omit<AssumptionLine, 'overridden'>[] {
  const imperial = settings.unitSystem === 'imperial';
  const enabled = new Set(settings.enabledMaterials);
  const lines: Omit<AssumptionLine, 'overridden'>[] = [];
  if (enabled.has('paint')) {
    const p = room.paint;
    lines.push(
      {
        id: 'paint.coverage',
        label: 'Paint coverage per coat',
        value: imperial
          ? `${n(m2ToSqFt(p.coverageM2PerL * L_PER_US_GAL), 0)} sq ft per US gallon`
          : `${n(p.coverageM2PerL)} m² per litre`,
      },
      { id: 'paint.coats', label: 'Paint coats', value: String(p.coats) },
      { id: 'paint.spare', label: 'Paint spare', value: `${n(p.wasteSparePct)}%` },
      { id: 'paint.packs', label: 'Paint can sizes', value: packsLabel(p.packSizesL, imperial) },
    );
  }
  if (enabled.has('flooring')) {
    const f = room.flooring;
    lines.push(
      {
        id: `flooring.waste.${f.layPattern}`,
        label: 'Flooring waste',
        value: `${n(f.wastePct)}% (${f.layPattern} lay)`,
      },
      { id: 'flooring.box', label: 'Flooring box coverage', value: area(f.boxCoverageM2, imperial) },
    );
  }
  if (enabled.has('tile')) {
    const t = room.tile;
    lines.push(
      {
        id: 'tile.size',
        label: 'Tile size',
        value: `${lengthMm(t.tileWidthM, imperial)} × ${lengthMm(t.tileHeightM, imperial)}`,
      },
      { id: 'tile.grout', label: 'Grout gap', value: lengthMm(t.groutM, imperial) },
      {
        id: `tile.waste.${t.layPattern}`,
        label: 'Tile waste',
        value: `${n(t.wastePct)}% (${t.layPattern} lay)`,
      },
      { id: 'tile.box', label: 'Tile box coverage', value: area(t.boxCoverageM2, imperial) },
    );
  }
  if (enabled.has('wallpaper')) {
    const w = room.wallpaper;
    lines.push(
      {
        id: 'wallpaper.roll.width',
        label: 'Wallpaper roll width',
        value: imperial ? `${n(mToIn(w.rollWidthM), 1)} in` : `${n(w.rollWidthM)} m`,
      },
      {
        id: 'wallpaper.roll.length',
        label: 'Wallpaper roll length',
        value: imperial ? `${n(mToFt(w.rollLengthM), 1)} ft` : `${n(w.rollLengthM)} m`,
      },
      {
        id: 'wallpaper.repeat',
        label: 'Wallpaper pattern repeat',
        value: w.repeatM > 0 ? `${n(w.repeatM * 100, 0)} cm` : 'Plain (no repeat)',
      },
      { id: 'wallpaper.spare', label: 'Wallpaper spare', value: `${n(w.wasteSparePct)}%` },
    );
  }
  return lines;
}

/**
 * Every value in use, so the Assumptions panel can show it (PRD Rule 5, NV5).
 * When rooms use different values for the same setting, each appears with the room name.
 */
export function buildAssumptions(rooms: readonly Room[], settings: Settings): AssumptionLine[] {
  const perRoom = rooms.map((room) => ({ room, lines: roomAssumptions(room, settings) }));
  const distinct = new Map<string, Set<string>>();
  for (const { lines } of perRoom) {
    for (const line of lines) {
      const values = distinct.get(line.id) ?? new Set<string>();
      values.add(line.value);
      distinct.set(line.id, values);
    }
  }
  const out: AssumptionLine[] = [];
  const seen = new Set<string>();
  for (const { room, lines } of perRoom) {
    for (const line of lines) {
      const differs = (distinct.get(line.id)?.size ?? 0) > 1;
      const label = differs ? `${line.label} (${room.name})` : line.label;
      const key = `${line.id}|${label}|${line.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        id: differs ? `${line.id}@${room.id}` : line.id,
        label,
        value: line.value,
        overridden: line.id in settings.overrides,
      });
    }
  }
  return out;
}

/**
 * The whole pipeline after validation: needs per room, summed per material,
 * rounded up once to whole packs, priced when prices exist (TDD §B.8).
 * Throws CalcValidationError for invalid input; never returns a partial list.
 */
export function buildShoppingList(project: Project): ShoppingList {
  const { rooms, settings } = project;
  if (rooms.length > LIMITS.maxRooms) throw new CalcValidationError('CALC_003', 'rooms');
  validateSettings(settings);
  rooms.forEach(validateRoom);

  const summed = sumNeeds(rooms.flatMap((room) => needsForRoom(room, settings)));
  const items = summed.map((need) => {
    const result = resultFromNeed(need);
    result.cost = estimateCost(result.coveredQuantity, settings.prices[need.key], settings.region);
    return result;
  });

  return {
    region: settings.region,
    unitSystem: settings.unitSystem,
    roomCount: rooms.length,
    items,
    assumptions: buildAssumptions(rooms, settings),
    totalCost: totalCost(items, settings.region),
  };
}

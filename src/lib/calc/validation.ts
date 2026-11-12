/**
 * Validation for every number and enum in the data model (PRD Rules 7-8).
 * All validators throw CalcValidationError and never return a result for bad input (NV4).
 * They also run on data read back from storage, so they accept unknown shapes safely.
 */
import { isRegion } from '../../data/regions';
import { SCHEMA_VERSION } from '../../types/project';
import type {
  FlooringOptions,
  LayPattern,
  MaterialId,
  Opening,
  PaintOptions,
  PriceKey,
  Project,
  Room,
  Settings,
  TileOptions,
  WallpaperOptions,
} from '../../types/project';
import { CalcValidationError } from './errors';
import type { ErrorCode } from './errors';
import { grossWallArea, openingsArea } from './geometry';

/** Numeric limits from PRD Rule 7 and Backend_Schema §2. */
export const LIMITS = {
  dimensionMinM: 0.5,
  dimensionMaxM: 100,
  heightMinM: 1.5,
  heightMaxM: 6,
  maxRooms: 10,
  maxOpenings: 20,
  coatsMin: 1,
  coatsMax: 4,
  wasteMin: 0,
  wasteMax: 30,
  priceMin: 0,
  priceMax: 100_000,
  nameMax: 40,
  idMax: 64,
  openingWidthMinM: 0.2,
  openingWidthMaxM: 5,
  openingHeightMinM: 0.2,
  openingHeightMaxM: 3,
  openingCountMin: 1,
  openingCountMax: 10,
  groutMaxM: 0.02,
  repeatMaxM: 0.9,
  /** Upper bounds that stop absurd tampered values. */
  coverageMax: 1000,
  sizeMaxM: 100,
  maxPackSizes: 10,
} as const;

const LAY_PATTERN_VALUES: readonly string[] = ['straight', 'diagonal', 'herringbone'];
const MATERIAL_VALUES: readonly string[] = ['paint', 'flooring', 'tile', 'wallpaper'];
const PRICE_KEY_VALUES: readonly string[] = [
  'paint',
  'ceilingPaint',
  'primer',
  'flooring',
  'tile',
  'wallpaper',
];

function fail(code: ErrorCode, field: string, params?: Record<string, string | number>): never {
  throw new CalcValidationError(code, field, params);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fail('CALC_007', field);
  }
  return value;
}

function requireRange(
  value: unknown,
  field: string,
  min: number,
  max: number,
  options: { code?: ErrorCode; unit?: string } = {},
): number {
  const n = requireNumber(value, field);
  if (n < min || n > max) {
    const unit = options.unit === undefined ? '' : ` ${options.unit}`;
    return fail(options.code ?? 'CALC_001', field, {
      min: `${min}${unit}`,
      max: `${max}${unit}`,
    });
  }
  return n;
}

function requirePositive(value: unknown, field: string, max: number): number {
  const n = requireNumber(value, field);
  if (!(n > 0) || n > max) {
    return fail('CALC_001', field, { min: 'more than 0', max: String(max) });
  }
  return n;
}

function requireOneOf(value: unknown, field: string, allowed: readonly string[]): string {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    return fail('CALC_001', field, { min: allowed[0] ?? '', max: allowed[allowed.length - 1] ?? '' });
  }
  return value;
}

/** Length, width and height of the room (CALC_001, CALC_007). */
export function validateRoomInput(room: Pick<Room, 'lengthM' | 'widthM' | 'heightM'>): void {
  requireRange(room.lengthM, 'lengthM', LIMITS.dimensionMinM, LIMITS.dimensionMaxM, { unit: 'm' });
  requireRange(room.widthM, 'widthM', LIMITS.dimensionMinM, LIMITS.dimensionMaxM, { unit: 'm' });
  requireRange(room.heightM, 'heightM', LIMITS.heightMinM, LIMITS.heightMaxM, { unit: 'm' });
}

/** Doors and windows (CALC_001, CALC_002, CALC_007, CALC_008). Call after validateRoomInput. */
export function validateOpenings(
  room: Pick<Room, 'lengthM' | 'widthM' | 'heightM' | 'openings'>,
): void {
  const openings: unknown = room.openings;
  if (!Array.isArray(openings)) {
    return fail('CALC_007', 'openings');
  }
  const list = openings as readonly unknown[];
  if (list.length > LIMITS.maxOpenings) {
    return fail('CALC_008', 'openings');
  }
  list.forEach((entry, index) => {
    const base = `openings[${index}]`;
    if (!isRecord(entry)) {
      return fail('CALC_007', base);
    }
    requireOneOf(entry.kind, `${base}.kind`, ['door', 'window']);
    requireRange(entry.widthM, `${base}.widthM`, LIMITS.openingWidthMinM, LIMITS.openingWidthMaxM, {
      unit: 'm',
    });
    requireRange(
      entry.heightM,
      `${base}.heightM`,
      LIMITS.openingHeightMinM,
      LIMITS.openingHeightMaxM,
      { unit: 'm' },
    );
    const count = requireRange(
      entry.count,
      `${base}.count`,
      LIMITS.openingCountMin,
      LIMITS.openingCountMax,
    );
    if (!Number.isInteger(count)) {
      return fail('CALC_001', `${base}.count`, {
        min: LIMITS.openingCountMin,
        max: LIMITS.openingCountMax,
      });
    }
    return undefined;
  });
  if (openingsArea(room) >= grossWallArea(room)) {
    fail('CALC_002', 'openings');
  }
}

/** Waste or spare percentage (CALC_005, CALC_007). */
export function validateWaste(pct: unknown, field = 'wastePct'): void {
  requireRange(pct, field, LIMITS.wasteMin, LIMITS.wasteMax, { code: 'CALC_005' });
}

/** Price per unit (CALC_006, CALC_007). */
export function validatePrice(price: unknown, field = 'price'): void {
  requireRange(price, field, LIMITS.priceMin, LIMITS.priceMax, { code: 'CALC_006' });
}

function validatePackSizes(sizes: unknown, field: string): void {
  if (!Array.isArray(sizes)) {
    return fail('CALC_007', field);
  }
  const list = sizes as readonly unknown[];
  if (list.length === 0 || list.length > LIMITS.maxPackSizes) {
    return fail('CALC_001', field, { min: 1, max: LIMITS.maxPackSizes });
  }
  list.forEach((size, index) => {
    requirePositive(size, `${field}[${index}]`, LIMITS.coverageMax);
  });
}

/** Coats, coverage, spare and pack sizes for paint (CALC_004, CALC_005). */
export function validatePaintOptions(options: PaintOptions): void {
  const coats = requireNumber(options.coats, 'coats');
  if (!Number.isInteger(coats) || coats < LIMITS.coatsMin || coats > LIMITS.coatsMax) {
    fail('CALC_004', 'coats');
  }
  requirePositive(options.coverageM2PerL, 'coverageM2PerL', LIMITS.coverageMax);
  validateWaste(options.wasteSparePct, 'wasteSparePct');
  validatePackSizes(options.packSizesL, 'packSizesL');
}

export function validateFlooringOptions(options: FlooringOptions): void {
  requireOneOf(options.layPattern, 'layPattern', LAY_PATTERN_VALUES);
  validateWaste(options.wastePct, 'wastePct');
  requirePositive(options.boxCoverageM2, 'boxCoverageM2', LIMITS.coverageMax);
}

export function validateTileOptions(options: TileOptions): void {
  requireOneOf(options.surface, 'surface', ['floor', 'wall']);
  requirePositive(options.tileWidthM, 'tileWidthM', LIMITS.sizeMaxM);
  requirePositive(options.tileHeightM, 'tileHeightM', LIMITS.sizeMaxM);
  requireRange(options.groutM, 'groutM', 0, LIMITS.groutMaxM, { unit: 'm' });
  requireOneOf(options.layPattern, 'layPattern', LAY_PATTERN_VALUES);
  validateWaste(options.wastePct, 'wastePct');
  requirePositive(options.boxCoverageM2, 'boxCoverageM2', LIMITS.coverageMax);
}

export function validateWallpaperOptions(options: WallpaperOptions): void {
  requirePositive(options.rollWidthM, 'rollWidthM', LIMITS.sizeMaxM);
  requirePositive(options.rollLengthM, 'rollLengthM', LIMITS.sizeMaxM);
  requireRange(options.repeatM, 'repeatM', 0, LIMITS.repeatMaxM, { unit: 'm' });
  validateWaste(options.wasteSparePct, 'wasteSparePct');
}

/** Every option block of a room. */
export function validateRoomOptions(room: Room): void {
  validatePaintOptions(room.paint);
  validateFlooringOptions(room.flooring);
  validateTileOptions(room.tile);
  validateWallpaperOptions(room.wallpaper);
}

/** Room name length. Names are only ever shown as text. */
export function isValidRoomName(name: unknown): name is string {
  return typeof name === 'string' && name.length >= 1 && name.length <= LIMITS.nameMax;
}

/** The whole room: size, openings, then options. */
export function validateRoom(room: Room): void {
  if (!isValidRoomName(room.name)) {
    fail('CALC_007', 'name');
  }
  validateRoomInput(room);
  validateOpenings(room);
  validateRoomOptions(room);
}

export function validateSettings(settings: Settings): void {
  if (!isRegion(settings.region)) fail('CALC_001', 'region', { min: 'US', max: 'AU' });
  requireOneOf(settings.unitSystem, 'unitSystem', ['metric', 'imperial']);
  if (typeof settings.includeCeiling !== 'boolean') fail('CALC_007', 'includeCeiling');
  if (typeof settings.includePrimer !== 'boolean') fail('CALC_007', 'includePrimer');
  const materials: unknown = settings.enabledMaterials;
  if (!Array.isArray(materials)) return fail('CALC_007', 'enabledMaterials');
  (materials as readonly unknown[]).forEach((m) => requireOneOf(m, 'enabledMaterials', MATERIAL_VALUES));
  if (!isRecord(settings.prices)) return fail('CALC_007', 'prices');
  for (const [key, value] of Object.entries(settings.prices)) {
    requireOneOf(key, 'prices', PRICE_KEY_VALUES);
    validatePrice(value, `prices.${key}`);
  }
  if (!isRecord(settings.overrides)) return fail('CALC_007', 'overrides');
  for (const [key, value] of Object.entries(settings.overrides)) {
    if (key.length > LIMITS.idMax) fail('CALC_001', 'overrides', { min: 0, max: LIMITS.idMax });
    requirePositive(value, `overrides.${key}`, LIMITS.coverageMax);
  }
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value));
}

function isShortId(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= LIMITS.idMax;
}

function cleanOpening(o: Opening): Opening {
  return { id: o.id, kind: o.kind, widthM: o.widthM, heightM: o.heightM, count: o.count };
}

function cleanRoom(r: Room): Room {
  return {
    id: r.id,
    name: r.name,
    lengthM: r.lengthM,
    widthM: r.widthM,
    heightM: r.heightM,
    openings: r.openings.map(cleanOpening),
    paint: {
      coats: r.paint.coats,
      coverageM2PerL: r.paint.coverageM2PerL,
      wasteSparePct: r.paint.wasteSparePct,
      packSizesL: [...r.paint.packSizesL],
    },
    flooring: {
      layPattern: r.flooring.layPattern as LayPattern,
      wastePct: r.flooring.wastePct,
      boxCoverageM2: r.flooring.boxCoverageM2,
    },
    tile: {
      surface: r.tile.surface,
      tileWidthM: r.tile.tileWidthM,
      tileHeightM: r.tile.tileHeightM,
      groutM: r.tile.groutM,
      layPattern: r.tile.layPattern as LayPattern,
      wastePct: r.tile.wastePct,
      boxCoverageM2: r.tile.boxCoverageM2,
    },
    wallpaper: {
      rollWidthM: r.wallpaper.rollWidthM,
      rollLengthM: r.wallpaper.rollLengthM,
      repeatM: r.wallpaper.repeatM,
      wasteSparePct: r.wallpaper.wasteSparePct,
    },
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function cleanSettings(s: Settings): Settings {
  const prices: Partial<Record<PriceKey, number>> = {};
  for (const [key, value] of Object.entries(s.prices)) {
    prices[key as PriceKey] = value;
  }
  return {
    region: s.region,
    unitSystem: s.unitSystem,
    includeCeiling: s.includeCeiling,
    includePrimer: s.includePrimer,
    enabledMaterials: [...s.enabledMaterials] as MaterialId[],
    prices,
    overrides: { ...s.overrides },
  };
}

/**
 * Validate untrusted data (for example from localStorage) and return a clean copy
 * that holds only the known fields. Returns null for anything invalid. Never throws.
 */
export function sanitizeProject(value: unknown): Project | null {
  try {
    if (!isRecord(value)) return null;
    if (value.schemaVersion !== SCHEMA_VERSION) return null;
    if (!Array.isArray(value.rooms) || value.rooms.length > LIMITS.maxRooms) return null;
    if (!isIsoDate(value.createdAt) || !isIsoDate(value.updatedAt)) return null;
    if (!isRecord(value.settings)) return null;

    const settings = value.settings as unknown as Settings;
    validateSettings(settings);

    const seen = new Set<string>();
    const rooms: Room[] = [];
    for (const entry of value.rooms as readonly unknown[]) {
      if (!isRecord(entry)) return null;
      const room = entry as unknown as Room;
      if (!isShortId(room.id) || seen.has(room.id)) return null;
      if (!isIsoDate(room.createdAt) || !isIsoDate(room.updatedAt)) return null;
      if (!isRecord(room.paint) || !isRecord(room.flooring)) return null;
      if (!isRecord(room.tile) || !isRecord(room.wallpaper)) return null;
      validateRoom(room);
      const ids = new Set<string>();
      for (const opening of room.openings) {
        if (!isShortId(opening.id) || ids.has(opening.id)) return null;
        ids.add(opening.id);
      }
      seen.add(room.id);
      rooms.push(cleanRoom(room));
    }

    return {
      schemaVersion: SCHEMA_VERSION,
      rooms,
      settings: cleanSettings(settings),
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  } catch {
    return null;
  }
}

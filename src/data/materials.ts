/**
 * Default presets for every material (PRD Rule 4). This is the only file that
 * holds coverage, waste and pack numbers (TDD §B.14). Every value can be
 * overridden by the visitor and is shown in the Assumptions panel (Rule 5, NV5).
 *
 * Canonical units in code: metres, m², litres. The imperial values from the PRD
 * are converted with exact factors from units.ts.
 */
import type {
  FlooringOptions,
  LayPattern,
  MaterialId,
  PaintOptions,
  TileOptions,
  UnitSystem,
  WallpaperOptions,
} from '../types/project';
import { ftToM, inToM, sqFtToM2, usGalToLitres } from '../lib/calc/units';

export interface PresetValue {
  value: number;
  unit: string;
}

export interface MaterialPreset {
  id: string;
  label: string;
  material: MaterialId;
  metric: PresetValue;
  imperial: PresetValue;
  /** Where the number comes from, and what to verify. */
  sourceNote: string;
}

export const LAY_PATTERNS: readonly LayPattern[] = ['straight', 'diagonal', 'herringbone'];

/** Waste by lay pattern, percent (PRD Rule 4). Used for flooring and tile. */
export const WASTE_PCT_BY_PATTERN: Readonly<Record<LayPattern, number>> = {
  straight: 10,
  diagonal: 15,
  herringbone: 20,
};

export const DEFAULT_COATS = 2;
export const PAINT_SPARE_PCT = 5;
/** Primer goes on in a single coat. */
export const PRIMER_COATS = 1;
export const WALLPAPER_SPARE_PCT = 10;
export const DEFAULT_HEIGHT_M = 2.4;
/** Pattern repeat choices in centimetres, 0 means a plain paper. */
export const WALLPAPER_REPEAT_CHOICES_CM: readonly number[] = [0, 16, 32, 64];

const PAINT_COVERAGE_METRIC_M2_PER_L = 10;
const PAINT_COVERAGE_IMPERIAL_SQFT_PER_US_GAL = 350;

/**
 * Retail paint pack sizes in litres. Typical shop sizes, not product data.
 * ⚠ VERIFY against current retailer ranges before launch.
 */
export const PAINT_PACK_SIZES_L: Readonly<Record<UnitSystem, readonly number[]>> = {
  metric: [1, 2.5, 5, 10],
  imperial: [usGalToLitres(0.25), usGalToLitres(1), usGalToLitres(5)],
};

export function paintCoverageM2PerL(system: UnitSystem): number {
  return system === 'imperial'
    ? sqFtToM2(PAINT_COVERAGE_IMPERIAL_SQFT_PER_US_GAL) / usGalToLitres(1)
    : PAINT_COVERAGE_METRIC_M2_PER_L;
}

export function boxCoverageM2(material: 'flooring' | 'tile', system: UnitSystem): number {
  if (material === 'flooring') return system === 'imperial' ? sqFtToM2(20) : 2;
  return system === 'imperial' ? sqFtToM2(10) : 1;
}

export function defaultPaintOptions(system: UnitSystem): PaintOptions {
  return {
    coats: DEFAULT_COATS,
    coverageM2PerL: paintCoverageM2PerL(system),
    wasteSparePct: PAINT_SPARE_PCT,
    packSizesL: [...PAINT_PACK_SIZES_L[system]],
  };
}

export function defaultFlooringOptions(system: UnitSystem): FlooringOptions {
  return {
    layPattern: 'straight',
    wastePct: WASTE_PCT_BY_PATTERN.straight,
    boxCoverageM2: boxCoverageM2('flooring', system),
  };
}

export function defaultTileOptions(system: UnitSystem): TileOptions {
  const imperial = system === 'imperial';
  return {
    surface: 'floor',
    tileWidthM: imperial ? inToM(12) : 0.3,
    tileHeightM: imperial ? inToM(12) : 0.3,
    groutM: imperial ? inToM(1 / 8) : 0.003,
    layPattern: 'straight',
    wastePct: WASTE_PCT_BY_PATTERN.straight,
    boxCoverageM2: boxCoverageM2('tile', system),
  };
}

/**
 * Standard roll sizes.
 * ⚠ VERIFY roll sizes against current retailer specs before launch (PRD Rule 4).
 */
export function defaultWallpaperOptions(system: UnitSystem): WallpaperOptions {
  const imperial = system === 'imperial';
  return {
    rollWidthM: imperial ? inToM(20.5) : 0.53,
    rollLengthM: imperial ? ftToM(33) : 10.05,
    repeatM: 0,
    wasteSparePct: WALLPAPER_SPARE_PCT,
  };
}

const wasteNote = 'PRD Rule 4: typical trade allowance for this lay pattern. Check with your supplier.';

function wastePresets(material: 'flooring' | 'tile'): MaterialPreset[] {
  const label = material === 'flooring' ? 'Flooring' : 'Tile';
  return LAY_PATTERNS.map((pattern) => ({
    id: `${material}.waste.${pattern}`,
    label: `${label} waste, ${pattern} lay`,
    material,
    metric: { value: WASTE_PCT_BY_PATTERN[pattern], unit: '%' },
    imperial: { value: WASTE_PCT_BY_PATTERN[pattern], unit: '%' },
    sourceNote: wasteNote,
  }));
}

/** Every preset, in the order the Assumptions panel lists them. */
export const MATERIAL_PRESETS: readonly MaterialPreset[] = [
  {
    id: 'paint.coverage',
    label: 'Paint coverage per coat',
    material: 'paint',
    metric: { value: PAINT_COVERAGE_METRIC_M2_PER_L, unit: 'm² per litre' },
    imperial: { value: PAINT_COVERAGE_IMPERIAL_SQFT_PER_US_GAL, unit: 'sq ft per US gallon' },
    sourceNote: 'PRD Rule 4: common label coverage. Check the label on your paint.',
  },
  {
    id: 'paint.coats',
    label: 'Paint coats',
    material: 'paint',
    metric: { value: DEFAULT_COATS, unit: 'coats' },
    imperial: { value: DEFAULT_COATS, unit: 'coats' },
    sourceNote: 'PRD Rule 4: two coats is the usual advice for a colour change.',
  },
  {
    id: 'paint.spare',
    label: 'Paint spare',
    material: 'paint',
    metric: { value: PAINT_SPARE_PCT, unit: '%' },
    imperial: { value: PAINT_SPARE_PCT, unit: '%' },
    sourceNote: 'PRD Rule 4: a small margin for touch-ups and uneven walls.',
  },
  ...wastePresets('flooring'),
  {
    id: 'flooring.box',
    label: 'Flooring box coverage',
    material: 'flooring',
    metric: { value: 2, unit: 'm² per box' },
    imperial: { value: 20, unit: 'sq ft per box' },
    sourceNote: 'PRD Rule 4: typical box. Check the box label.',
  },
  ...wastePresets('tile'),
  {
    id: 'tile.size',
    label: 'Tile size',
    material: 'tile',
    metric: { value: 300, unit: 'mm square' },
    imperial: { value: 12, unit: 'in square' },
    sourceNote: 'PRD Rule 4: a common size.',
  },
  {
    id: 'tile.grout',
    label: 'Grout gap',
    material: 'tile',
    metric: { value: 3, unit: 'mm' },
    imperial: { value: 0.125, unit: 'in' },
    sourceNote: 'PRD Rule 4: a common joint width.',
  },
  {
    id: 'tile.box',
    label: 'Tile box coverage',
    material: 'tile',
    metric: { value: 1, unit: 'm² per box' },
    imperial: { value: 10, unit: 'sq ft per box' },
    sourceNote: 'PRD Rule 4: typical box. Check the box label.',
  },
  {
    id: 'wallpaper.roll.width',
    label: 'Wallpaper roll width',
    material: 'wallpaper',
    metric: { value: 0.53, unit: 'm' },
    imperial: { value: 20.5, unit: 'in' },
    sourceNote: '⚠ VERIFY against current retailer specs before launch (PRD Rule 4).',
  },
  {
    id: 'wallpaper.roll.length',
    label: 'Wallpaper roll length',
    material: 'wallpaper',
    metric: { value: 10.05, unit: 'm' },
    imperial: { value: 33, unit: 'ft' },
    sourceNote: '⚠ VERIFY against current retailer specs before launch (PRD Rule 4).',
  },
  {
    id: 'wallpaper.repeat',
    label: 'Wallpaper pattern repeat',
    material: 'wallpaper',
    metric: { value: 0, unit: 'cm (0 is plain)' },
    imperial: { value: 0, unit: 'cm (0 is plain)' },
    sourceNote: 'PRD Rule 4: plain paper by default. Choices are 16, 32 or 64 cm.',
  },
  {
    id: 'wallpaper.spare',
    label: 'Wallpaper spare',
    material: 'wallpaper',
    metric: { value: WALLPAPER_SPARE_PCT, unit: '%' },
    imperial: { value: WALLPAPER_SPARE_PCT, unit: '%' },
    sourceNote: 'PRD Rule 4: spare for pattern matching and mistakes.',
  },
];

export function getPreset(id: string): MaterialPreset | undefined {
  return MATERIAL_PRESETS.find((preset) => preset.id === id);
}

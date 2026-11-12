/**
 * Unit conversions. Metres are the canonical length unit, m² the area unit
 * and litres the volume unit. Pure functions only.
 */

/** Exact by definition. */
export const M_PER_FT = 0.3048;
export const M_PER_IN = 0.0254;
export const M2_PER_SQFT = M_PER_FT * M_PER_FT;
/** US liquid gallon, exact by definition. */
export const L_PER_US_GAL = 3.785411784;
/** UK (imperial) gallon, exact by definition. */
export const L_PER_UK_GAL = 4.54609;

/** Tolerance that stops floating point noise from adding a whole pack. */
const CEIL_EPSILON = 1e-9;

export function mToFt(m: number): number {
  return m / M_PER_FT;
}
export function ftToM(ft: number): number {
  return ft * M_PER_FT;
}
export function mToIn(m: number): number {
  return m / M_PER_IN;
}
export function inToM(inches: number): number {
  return inches * M_PER_IN;
}
export function mmToM(mm: number): number {
  return mm / 1000;
}
export function mToMm(m: number): number {
  return m * 1000;
}
export function m2ToSqFt(m2: number): number {
  return m2 / M2_PER_SQFT;
}
export function sqFtToM2(sqFt: number): number {
  return sqFt * M2_PER_SQFT;
}
export function litresToUsGal(litres: number): number {
  return litres / L_PER_US_GAL;
}
export function usGalToLitres(gal: number): number {
  return gal * L_PER_US_GAL;
}
export function litresToUkGal(litres: number): number {
  return litres / L_PER_UK_GAL;
}
export function ukGalToLitres(gal: number): number {
  return gal * L_PER_UK_GAL;
}

/** Round to a number of decimals (default 6, the round-trip precision). */
export function roundTo(value: number, decimals = 6): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Round up to a whole multiple of `step` (default 1).
 * Values within a tiny tolerance of a multiple do not round up.
 */
export function ceilUp(value: number, step = 1): number {
  if (!(step > 0)) {
    throw new RangeError('step must be greater than 0');
  }
  const multiples = value / step;
  return Math.ceil(multiples - CEIL_EPSILON) * step;
}

/** Whole number of packs of `packSize` needed to cover `quantity`. */
export function ceilPacks(quantity: number, packSize: number): number {
  if (!(packSize > 0)) {
    throw new RangeError('packSize must be greater than 0');
  }
  if (quantity <= 0) return 0;
  return Math.ceil(quantity / packSize - CEIL_EPSILON);
}

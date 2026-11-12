import type { MaterialNeed, MaterialResult, PackLine, PackResult } from '../../types/calc';
import { ceilPacks, roundTo } from './units';

/** Tolerance for comparing quantities, far below any real pack size. */
const EPSILON = 1e-9;

interface Candidate {
  counts: number[];
  total: number;
  packs: number;
}

function normaliseSizes(packSizes: readonly number[]): number[] {
  if (packSizes.length === 0) {
    throw new RangeError('at least one pack size is required');
  }
  const sizes: number[] = [];
  for (const size of packSizes) {
    if (!Number.isFinite(size) || !(size > 0)) {
      throw new RangeError('pack sizes must be greater than 0');
    }
    if (!sizes.some((existing) => Math.abs(existing - size) < EPSILON)) sizes.push(size);
  }
  return sizes.sort((a, b) => b - a);
}

/**
 * Choose whole packs that cover `requiredQuantity` and never fall below it.
 * Picks the combination with the least leftover, then the fewest packs.
 * Returns the unrounded need alongside, so both numbers can be shown (PRD Rule 3).
 */
export function choosePacks(requiredQuantity: number, packSizes: readonly number[]): PackResult {
  if (!Number.isFinite(requiredQuantity)) {
    throw new RangeError('requiredQuantity must be a finite number');
  }
  const sizes = normaliseSizes(packSizes);
  const required = Math.max(0, requiredQuantity);

  if (required === 0) {
    return { packs: [], totalPacks: 0, totalQuantity: 0, exactNeed: requiredQuantity };
  }

  let best: Candidate | null = null;
  const counts = new Array<number>(sizes.length).fill(0);

  const consider = (total: number, packs: number): void => {
    if (
      best === null ||
      total < best.total - EPSILON ||
      (Math.abs(total - best.total) <= EPSILON && packs < best.packs)
    ) {
      best = { counts: [...counts], total, packs };
    }
  };

  const search = (index: number, remaining: number, usedTotal: number, usedPacks: number): void => {
    if (best !== null && usedTotal > best.total + EPSILON) return;
    const size = sizes[index] as number;
    if (index === sizes.length - 1) {
      const n = ceilPacks(remaining, size);
      counts[index] = n;
      consider(usedTotal + n * size, usedPacks + n);
      counts[index] = 0;
      return;
    }
    const next = sizes[index + 1] as number;
    const floorCount = remaining > 0 ? Math.floor(remaining / size + EPSILON) : 0;
    // Dropping more than this many packs of the larger size just swaps them for smaller packs.
    const lowest = Math.max(0, floorCount - Math.ceil(size / next));
    for (let n = lowest; n <= floorCount + 1; n += 1) {
      counts[index] = n;
      search(index + 1, remaining - n * size, usedTotal + n * size, usedPacks + n);
    }
    counts[index] = 0;
  };

  search(0, required, 0, 0);

  const chosen = best as Candidate | null;
  if (chosen === null) {
    throw new Error('no pack combination found');
  }
  const packs: PackLine[] = [];
  sizes.forEach((packSize, i) => {
    const count = chosen.counts[i] ?? 0;
    if (count > 0) packs.push({ packSize, count });
  });
  return {
    packs,
    totalPacks: chosen.packs,
    totalQuantity: roundTo(chosen.total, 9),
    exactNeed: requiredQuantity,
  };
}

/**
 * Round one unrounded need up to whole packs. This is the single place where a
 * need becomes a "buy" quantity, so rounding happens once (PRD Rule 3, NV3).
 */
export function resultFromNeed(need: MaterialNeed): MaterialResult {
  const packs = choosePacks(need.exactQuantity, need.packSizes);
  const result: MaterialResult = {
    key: need.key,
    label: need.label,
    unit: need.unit,
    buyQuantity: packs.totalPacks,
    exactQuantity: need.exactQuantity,
    coveredQuantity: packs.totalQuantity,
    packBreakdown: packs.packs,
  };
  if (need.tilesNeeded !== undefined) {
    result.tilesNeeded = Math.ceil(need.tilesNeeded - EPSILON);
  }
  return result;
}

import { PRIMER_COATS } from '../../data/materials';
import type { PaintCalcOptions, PaintNeeds, PaintResult } from '../../types/calc';
import type { Room } from '../../types/project';
import { ceilingArea, netWallArea } from './geometry';
import { resultFromNeed } from './packSizes';

/** Litres for an area: area x coats / coverage, plus the spare percentage. */
function litres(areaM2: number, coats: number, coverageM2PerL: number, sparePct: number): number {
  return ((areaM2 * coats) / coverageM2PerL) * (1 + sparePct / 100);
}

/**
 * Unrounded paint needs for one room, in litres. Rooms are summed before rounding
 * (shoppingList.ts), so nothing here is rounded to packs.
 * Walls use the net area (doors and windows removed). The ceiling is optional.
 * Primer is optional, one coat, on the walls and, when included, the ceiling.
 */
export function paintNeeds(room: Room, calc: PaintCalcOptions): PaintNeeds {
  const { coats, coverageM2PerL, wasteSparePct, packSizesL } = room.paint;
  const walls = netWallArea(room);
  const ceiling = ceilingArea(room);

  const needs: PaintNeeds = {
    wall: {
      key: 'paint',
      label: 'Wall paint',
      unit: 'L',
      exactQuantity: litres(walls, coats, coverageM2PerL, wasteSparePct),
      packSizes: packSizesL,
    },
  };
  if (calc.includeCeiling) {
    needs.ceiling = {
      key: 'ceilingPaint',
      label: 'Ceiling paint',
      unit: 'L',
      exactQuantity: litres(ceiling, coats, coverageM2PerL, wasteSparePct),
      packSizes: packSizesL,
    };
  }
  if (calc.includePrimer) {
    const primed = walls + (calc.includeCeiling ? ceiling : 0);
    needs.primer = {
      key: 'primer',
      label: 'Primer',
      unit: 'L',
      exactQuantity: litres(primed, PRIMER_COATS, coverageM2PerL, wasteSparePct),
      packSizes: packSizesL,
    };
  }
  return needs;
}

/** Paint for a single room, rounded up to cans. */
export function calculatePaint(room: Room, calc: PaintCalcOptions): PaintResult {
  const needs = paintNeeds(room, calc);
  const result: PaintResult = { wall: resultFromNeed(needs.wall) };
  if (needs.ceiling) result.ceiling = resultFromNeed(needs.ceiling);
  if (needs.primer) result.primer = resultFromNeed(needs.primer);
  return result;
}

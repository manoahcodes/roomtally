import type { MaterialNeed, MaterialResult } from '../../types/calc';
import type { Room } from '../../types/project';
import { CalcValidationError } from './errors';
import { netWallArea } from './geometry';
import { resultFromNeed } from './packSizes';
import { ceilUp, roundTo } from './units';

export interface WallpaperDetail {
  /** Length of one drop (strip) in metres, including pattern repeat. */
  dropLengthM: number;
  /** Whole strips that fit on one roll. */
  dropsPerRoll: number;
  /** Whole strips needed for the room, before spare. */
  drops: number;
}

/**
 * Strip maths for one room. A strip is a physical piece, so whole strips are counted
 * per room. That is not purchase rounding: strips become fractional rolls, rooms are
 * summed, and only the total is rounded up to whole rolls.
 *
 * - Strip length is the room height, rounded up to a whole pattern repeat if there is one.
 * - Strips per roll is whole strips only; a leftover piece shorter than a strip is not used.
 * - Width to cover is the wall area after doors and windows divided by the room height,
 *   so openings reduce the strips needed.
 */
export function wallpaperDetail(room: Room): WallpaperDetail {
  const { rollWidthM, rollLengthM, repeatM } = room.wallpaper;
  const dropLengthM = repeatM > 0 ? roundTo(ceilUp(room.heightM, repeatM), 9) : room.heightM;
  const dropsPerRoll = Math.floor(rollLengthM / dropLengthM + 1e-9);
  if (dropsPerRoll < 1) {
    throw new CalcValidationError('CALC_001', 'rollLengthM', {
      min: `${Math.ceil(dropLengthM * 100) / 100} m`,
      max: '100 m',
    });
  }
  const widthToCover = netWallArea(room) / room.heightM;
  const drops = Math.ceil(widthToCover / rollWidthM - 1e-9);
  return { dropLengthM, dropsPerRoll, drops };
}

/** Unrounded need for one room, in rolls (fractional), with the spare percentage added. */
export function wallpaperNeed(room: Room): MaterialNeed {
  const { dropsPerRoll, drops } = wallpaperDetail(room);
  return {
    key: 'wallpaper',
    label: 'Wallpaper',
    unit: 'roll',
    exactQuantity: (drops / dropsPerRoll) * (1 + room.wallpaper.wasteSparePct / 100),
    packSizes: [1],
  };
}

/** Wallpaper for a single room, rounded up to whole rolls. */
export function calculateWallpaper(room: Room): MaterialResult {
  return resultFromNeed(wallpaperNeed(room));
}

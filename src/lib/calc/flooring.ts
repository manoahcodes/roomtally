import type { MaterialNeed, MaterialResult } from '../../types/calc';
import type { Room } from '../../types/project';
import { floorArea } from './geometry';
import { resultFromNeed } from './packSizes';

/**
 * Unrounded flooring need for one room, in m² of flooring to buy.
 * Floor area plus the waste percentage in the room's options. Presets for
 * straight, diagonal and herringbone lay live in src/data/materials.ts and are
 * written into `wastePct` when the visitor picks a pattern.
 */
export function flooringNeed(room: Room): MaterialNeed {
  const { wastePct, boxCoverageM2 } = room.flooring;
  return {
    key: 'flooring',
    label: 'Flooring',
    unit: 'm2',
    exactQuantity: floorArea(room) * (1 + wastePct / 100),
    packSizes: [boxCoverageM2],
  };
}

/** Flooring for a single room, rounded up to whole boxes. */
export function calculateFlooring(room: Room): MaterialResult {
  return resultFromNeed(flooringNeed(room));
}

import type { MaterialNeed, MaterialResult } from '../../types/calc';
import type { Room } from '../../types/project';
import { floorArea, netWallArea } from './geometry';
import { resultFromNeed } from './packSizes';

/**
 * Unrounded tile need for one room.
 *
 * Each tile takes up its size plus one grout gap on each axis. The surface area is
 * divided by that to get tiles, then waste is added. The quantity is reported in m²
 * of tile product (tiles x tile face area), which is what box coverage on the label
 * measures, so boxes = quantity / box coverage.
 * `tilesNeeded` is the unrounded tile count, rounded up once after rooms are summed.
 */
export function tileNeed(room: Room): MaterialNeed {
  const { surface, tileWidthM, tileHeightM, groutM, wastePct, boxCoverageM2 } = room.tile;
  const area = surface === 'wall' ? netWallArea(room) : floorArea(room);
  const tileWithGroutArea = (tileWidthM + groutM) * (tileHeightM + groutM);
  const tilesWithWaste = (area / tileWithGroutArea) * (1 + wastePct / 100);
  return {
    key: 'tile',
    label: surface === 'wall' ? 'Wall tile' : 'Floor tile',
    unit: 'm2',
    exactQuantity: tilesWithWaste * tileWidthM * tileHeightM,
    packSizes: [boxCoverageM2],
    tilesNeeded: tilesWithWaste,
  };
}

/** Tile for a single room: tile count and boxes, rounded up. */
export function calculateTile(room: Room): MaterialResult {
  return resultFromNeed(tileNeed(room));
}

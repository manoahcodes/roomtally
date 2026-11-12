import { describe, expect, it } from 'vitest';
import { defaultTileOptions, withPatternWaste } from '../../src/data/materials';
import { CalcValidationError } from '../../src/lib/calc/errors';
import { calculateTile, tileNeed } from '../../src/lib/calc/tile';
import { makeInvalidRoom, makeRoom, makeRoomWithOpenings } from '../helpers/roomFixtures';

// Metric defaults: 300 mm tiles, 3 mm grout, 10% waste, 1 m2 box.
// A tile with its grout gap takes 0.303 x 0.303 = 0.091809 m2.
const TILE_PITCH_AREA = 0.303 * 0.303;

describe('calculateTile, floor of a 4 x 3.5 m room (14 m2)', () => {
  const room = makeRoom();

  it('needs 14 / 0.091809 x 1.10 = 167.74 tiles, rounded up to 168', () => {
    const r = calculateTile(room);
    expect(r.tilesNeeded).toBe(168);
    expect((14 / TILE_PITCH_AREA) * 1.1).toBeCloseTo(167.7395, 3);
  });

  it('needs 15.0965 m2 of tile product, which is 16 boxes of 1 m2', () => {
    const r = calculateTile(room);
    expect(r.exactQuantity).toBeCloseTo(15.0965, 3);
    expect(r.buyQuantity).toBe(16);
    expect(r.coveredQuantity).toBe(16);
    expect(r.unit).toBe('m2');
    expect(r.label).toBe('Floor tile');
  });

  it('never buys less than the exact need', () => {
    const r = calculateTile(room);
    expect(r.coveredQuantity).toBeGreaterThanOrEqual(r.exactQuantity);
  });
});

describe('grout gap', () => {
  it('a wider gap means fewer tiles for the same area', () => {
    const narrow = tileNeed(makeRoom({ tile: { ...defaultTileOptions('metric'), groutM: 0.002 } }));
    const wide = tileNeed(makeRoom({ tile: { ...defaultTileOptions('metric'), groutM: 0.01 } }));
    expect(wide.tilesNeeded!).toBeLessThan(narrow.tilesNeeded!);
  });

  it('with no gap, 300 mm tiles on 14 m2 need 14 / 0.09 x 1.10 = 171.11 tiles', () => {
    const need = tileNeed(makeRoom({ tile: { ...defaultTileOptions('metric'), groutM: 0 } }));
    expect(need.tilesNeeded).toBeCloseTo(171.1111, 3);
    expect(need.exactQuantity).toBeCloseTo(15.4, 9);
  });
});

describe('layout waste', () => {
  it('uses the waste in the options: herringbone 20% is more than straight 10%', () => {
    const straight = tileNeed(makeRoom({ tile: withPatternWaste(defaultTileOptions('metric'), 'straight') }));
    const herringbone = tileNeed(
      makeRoom({ tile: withPatternWaste(defaultTileOptions('metric'), 'herringbone') }),
    );
    expect(herringbone.exactQuantity / straight.exactQuantity).toBeCloseTo(1.2 / 1.1, 9);
  });
});

describe('wall surface', () => {
  it('uses the net wall area: 32.76 m2 for the room with a door and window', () => {
    const room = makeRoomWithOpenings({ tile: { ...defaultTileOptions('metric'), surface: 'wall' } });
    const r = calculateTile(room);
    expect(r.label).toBe('Wall tile');
    // 32.76 / 0.091809 = 356.83 tiles, x 1.10 = 392.51; x 0.09 = 35.326 m2.
    expect(r.exactQuantity).toBeCloseTo(35.3259, 3);
    expect(r.tilesNeeded).toBe(393);
    expect(r.buyQuantity).toBe(36);
  });

  it('throws CALC_002 when openings cover the walls', () => {
    const room = makeInvalidRoom('openingsTooBig');
    room.tile = { ...room.tile, surface: 'wall' };
    expect(() => tileNeed(room)).toThrow(CalcValidationError);
  });
});

describe('imperial defaults', () => {
  it('12 in tiles with a 1/8 in gap and a 10 sq ft box still round up to whole boxes', () => {
    const r = calculateTile(makeRoom({ tile: defaultTileOptions('imperial') }));
    expect(Number.isInteger(r.buyQuantity)).toBe(true);
    expect(r.coveredQuantity).toBeGreaterThanOrEqual(r.exactQuantity);
  });
});

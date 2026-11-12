import { describe, expect, it } from 'vitest';
import { defaultWallpaperOptions } from '../../src/data/materials';
import { CalcValidationError } from '../../src/lib/calc/errors';
import { calculateWallpaper, wallpaperDetail, wallpaperNeed } from '../../src/lib/calc/wallpaper';
import { makeInvalidRoom, makeRoom, makeRoomWithOpenings } from '../helpers/roomFixtures';

// Metric roll: 0.53 m wide, 10.05 m long. Room height 2.4 m.
const base = defaultWallpaperOptions('metric');

describe('plain paper, room 4 x 3.5 x 2.4 m with a door and window', () => {
  const room = makeRoomWithOpenings();

  it('has 4 strips per roll: floor(10.05 / 2.4)', () => {
    expect(wallpaperDetail(room).dropsPerRoll).toBe(4);
  });

  it('needs 26 strips: net wall 32.76 / 2.4 = 13.65 m wide, / 0.53 = 25.75', () => {
    expect(wallpaperDetail(room).drops).toBe(26);
  });

  it('needs 26 / 4 x 1.10 = 7.15 rolls and buys 8', () => {
    const r = calculateWallpaper(room);
    expect(r.exactQuantity).toBeCloseTo(7.15, 9);
    expect(r.buyQuantity).toBe(8);
    expect(r.unit).toBe('roll');
  });
});

describe('openings reduce the strips', () => {
  it('without openings the same room needs 29 strips: 15 m / 0.53 = 28.3', () => {
    expect(wallpaperDetail(makeRoom()).drops).toBe(29);
  });
});

describe('pattern repeat', () => {
  it('a 64 cm repeat makes each strip 2.56 m and leaves 3 strips per roll', () => {
    const room = makeRoomWithOpenings({ wallpaper: { ...base, repeatM: 0.64 } });
    const d = wallpaperDetail(room);
    expect(d.dropLengthM).toBeCloseTo(2.56, 9);
    expect(d.dropsPerRoll).toBe(3);
  });

  it('a 64 cm repeat needs 26 / 3 x 1.10 = 9.53 rolls and buys 10', () => {
    const room = makeRoomWithOpenings({ wallpaper: { ...base, repeatM: 0.64 } });
    const r = calculateWallpaper(room);
    expect(r.exactQuantity).toBeCloseTo(9.5333, 3);
    expect(r.buyQuantity).toBe(10);
  });

  it('a 16 cm repeat divides 2.4 m evenly, so the strip stays 2.4 m', () => {
    const room = makeRoomWithOpenings({ wallpaper: { ...base, repeatM: 0.16 } });
    expect(wallpaperDetail(room).dropLengthM).toBeCloseTo(2.4, 9);
  });

  it('a repeat never makes the need smaller than plain paper', () => {
    const plain = wallpaperNeed(makeRoomWithOpenings()).exactQuantity;
    const repeat = wallpaperNeed(makeRoomWithOpenings({ wallpaper: { ...base, repeatM: 0.32 } }));
    expect(repeat.exactQuantity).toBeGreaterThanOrEqual(plain);
  });
});

describe('spare', () => {
  it('0% spare gives 26 / 4 = 6.5 rolls and buys 7', () => {
    const room = makeRoomWithOpenings({ wallpaper: { ...base, wasteSparePct: 0 } });
    const r = calculateWallpaper(room);
    expect(r.exactQuantity).toBeCloseTo(6.5, 9);
    expect(r.buyQuantity).toBe(7);
  });
});

describe('errors', () => {
  it('throws CALC_001 when one strip is longer than a roll', () => {
    const room = makeRoom({ wallpaper: { ...base, rollLengthM: 2 } });
    try {
      wallpaperDetail(room);
      expect.unreachable();
    } catch (error) {
      expect((error as CalcValidationError).code).toBe('CALC_001');
      expect((error as CalcValidationError).field).toBe('rollLengthM');
    }
  });

  it('throws CALC_002 when openings cover the walls', () => {
    expect(() => wallpaperDetail(makeInvalidRoom('openingsTooBig'))).toThrow(CalcValidationError);
  });
});

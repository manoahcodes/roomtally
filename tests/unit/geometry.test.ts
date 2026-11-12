import { describe, expect, it } from 'vitest';
import {
  ceilingArea,
  floorArea,
  grossWallArea,
  netWallArea,
  openingsArea,
} from '../../src/lib/calc/geometry';
import { CalcValidationError } from '../../src/lib/calc/errors';
import { makeInvalidRoom, makeOpening, makeRoom, makeRoomWithOpenings } from '../helpers/roomFixtures';

describe('floorArea and ceilingArea', () => {
  it('multiplies length by width', () => {
    expect(floorArea(makeRoom())).toBeCloseTo(14, 9);
  });
  it('gives a ceiling the same area as the floor', () => {
    expect(ceilingArea(makeRoom({ lengthM: 5, widthM: 2 }))).toBeCloseTo(10, 9);
  });
});

describe('grossWallArea', () => {
  it('adds the four walls: 2 x (4 + 3.5) x 2.4 = 36 m2', () => {
    expect(grossWallArea(makeRoom())).toBeCloseTo(36, 9);
  });
});

describe('openingsArea', () => {
  it('is zero for a room with no openings', () => {
    expect(openingsArea(makeRoom())).toBe(0);
  });
  it('adds a door and a window: 1.8 + 1.44 = 3.24 m2', () => {
    expect(openingsArea(makeRoomWithOpenings())).toBeCloseTo(3.24, 9);
  });
  it('multiplies by the opening count', () => {
    const room = makeRoom({ openings: [makeOpening({ widthM: 1, heightM: 1, count: 3 })] });
    expect(openingsArea(room)).toBeCloseTo(3, 9);
  });
});

describe('netWallArea', () => {
  it('equals the gross area without openings', () => {
    expect(netWallArea(makeRoom())).toBeCloseTo(36, 9);
  });
  it('subtracts openings: 36 - 3.24 = 32.76 m2', () => {
    expect(netWallArea(makeRoomWithOpenings())).toBeCloseTo(32.76, 9);
  });
  it('throws CALC_002 when openings cover all the wall', () => {
    const room = makeInvalidRoom('openingsTooBig');
    expect(() => netWallArea(room)).toThrow(CalcValidationError);
    try {
      netWallArea(room);
    } catch (error) {
      expect((error as CalcValidationError).code).toBe('CALC_002');
    }
  });
});

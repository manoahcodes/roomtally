import { describe, expect, it } from 'vitest';
import { defaultPaintOptions } from '../../src/data/materials';
import { CalcValidationError } from '../../src/lib/calc/errors';
import { calculatePaint, paintNeeds } from '../../src/lib/calc/paint';
import { makeInvalidRoom, makeRoom, makeRoomWithOpenings } from '../helpers/roomFixtures';

const WALLS_ONLY = { includeCeiling: false, includePrimer: false };

describe('calculatePaint, room A: 4 x 3.5 x 2.4 m, door and window, 2 coats, 5% spare', () => {
  // Net wall 36 - 3.24 = 32.76 m2. 32.76 x 2 / 10 = 6.552 L. Plus 5% = 6.8796 L.
  const room = makeRoomWithOpenings();

  it('needs 6.8796 L of wall paint', () => {
    const { wall } = calculatePaint(room, WALLS_ONLY);
    expect(wall.exactQuantity).toBeCloseTo(6.8796, 4);
    expect(wall.unit).toBe('L');
  });

  it('buys 7 L as one 5 L can and two 1 L cans: 3 cans', () => {
    const { wall } = calculatePaint(room, WALLS_ONLY);
    expect(wall.coveredQuantity).toBe(7);
    expect(wall.buyQuantity).toBe(3);
    expect(wall.packBreakdown).toEqual([
      { packSize: 5, count: 1 },
      { packSize: 1, count: 2 },
    ]);
  });

  it('never buys less than the exact need', () => {
    const { wall } = calculatePaint(room, WALLS_ONLY);
    expect(wall.coveredQuantity).toBeGreaterThanOrEqual(wall.exactQuantity);
  });

  it('adds ceiling paint: 14 x 2 / 10 x 1.05 = 2.94 L, bought as three 1 L cans', () => {
    const { ceiling } = calculatePaint(room, { includeCeiling: true, includePrimer: false });
    expect(ceiling).toBeDefined();
    expect(ceiling!.exactQuantity).toBeCloseTo(2.94, 4);
    expect(ceiling!.coveredQuantity).toBe(3);
    expect(ceiling!.label).toBe('Ceiling paint');
  });

  it('adds primer for the walls: 32.76 x 1 / 10 x 1.05 = 3.4398 L, bought as 3.5 L', () => {
    const { primer } = calculatePaint(room, { includeCeiling: false, includePrimer: true });
    expect(primer!.exactQuantity).toBeCloseTo(3.4398, 4);
    expect(primer!.coveredQuantity).toBe(3.5);
  });

  it('adds the ceiling to the primer when both are on: 46.76 / 10 x 1.05 = 4.9098 L', () => {
    const { primer } = calculatePaint(room, { includeCeiling: true, includePrimer: true });
    expect(primer!.exactQuantity).toBeCloseTo(4.9098, 4);
    expect(primer!.coveredQuantity).toBe(5);
    expect(primer!.buyQuantity).toBe(1);
  });

  it('leaves out ceiling and primer when they are off', () => {
    const result = calculatePaint(room, WALLS_ONLY);
    expect(result.ceiling).toBeUndefined();
    expect(result.primer).toBeUndefined();
  });
});

describe('calculatePaint, room B: 5 x 3 x 2.4 m, no openings, 3 coats, no spare', () => {
  // Gross wall 2 x 8 x 2.4 = 38.4 m2. 38.4 x 3 / 10 = 11.52 L.
  const room = makeRoom({
    lengthM: 5,
    widthM: 3,
    paint: { ...defaultPaintOptions('metric'), coats: 3, wasteSparePct: 0 },
  });

  it('needs 11.52 L', () => {
    expect(calculatePaint(room, WALLS_ONLY).wall.exactQuantity).toBeCloseTo(11.52, 6);
  });

  it('buys 12 L as a 10 L can and two 1 L cans: 3 cans', () => {
    const { wall } = calculatePaint(room, WALLS_ONLY);
    expect(wall.coveredQuantity).toBe(12);
    expect(wall.buyQuantity).toBe(3);
  });
});

describe('imperial defaults', () => {
  it('turns 350 sq ft per US gallon into about 8.5898 m2 per litre', () => {
    expect(defaultPaintOptions('imperial').coverageM2PerL).toBeCloseTo(8.5898, 3);
  });

  it('needs more paint per m2 than the metric default of 10 m2 per litre', () => {
    const imperial = makeRoom({ paint: defaultPaintOptions('imperial') });
    const metric = makeRoom({ paint: defaultPaintOptions('metric') });
    expect(paintNeeds(imperial, WALLS_ONLY).wall.exactQuantity).toBeGreaterThan(
      paintNeeds(metric, WALLS_ONLY).wall.exactQuantity,
    );
  });

  it('uses gallon-based can sizes', () => {
    const wall = calculatePaint(makeRoom({ paint: defaultPaintOptions('imperial') }), WALLS_ONLY).wall;
    expect(wall.coveredQuantity).toBeGreaterThanOrEqual(wall.exactQuantity);
    expect(wall.unit).toBe('L');
  });
});

describe('paintNeeds', () => {
  it('returns unrounded litres so rooms can be summed before rounding', () => {
    const needs = paintNeeds(makeRoomWithOpenings(), WALLS_ONLY);
    expect(needs.wall.exactQuantity).toBeCloseTo(6.8796, 4);
    expect(needs.wall.packSizes).toEqual([1, 2.5, 5, 10]);
  });
});

describe('errors', () => {
  it('throws CALC_002 when openings cover the walls', () => {
    try {
      calculatePaint(makeInvalidRoom('openingsTooBig'), WALLS_ONLY);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(CalcValidationError);
      expect((error as CalcValidationError).code).toBe('CALC_002');
    }
  });
});

import { describe, expect, it } from 'vitest';
import {
  WASTE_PCT_BY_PATTERN,
  defaultFlooringOptions,
  withPatternWaste,
} from '../../src/data/materials';
import { calculateFlooring, flooringNeed } from '../../src/lib/calc/flooring';
import { makeRoom } from '../helpers/roomFixtures';

// 4 x 3.5 m room: 14 m2 of floor. Metric box covers 2 m2.
function roomWith(pattern: 'straight' | 'diagonal' | 'herringbone') {
  return makeRoom({ flooring: withPatternWaste(defaultFlooringOptions('metric'), pattern) });
}

describe('lay pattern waste presets', () => {
  it('are 10%, 15% and 20%', () => {
    expect(WASTE_PCT_BY_PATTERN).toEqual({ straight: 10, diagonal: 15, herringbone: 20 });
  });
});

describe('calculateFlooring', () => {
  it('straight lay: 14 x 1.10 = 15.4 m2, 7.7 boxes, buy 8', () => {
    const r = calculateFlooring(roomWith('straight'));
    expect(r.exactQuantity).toBeCloseTo(15.4, 9);
    expect(r.buyQuantity).toBe(8);
    expect(r.coveredQuantity).toBe(16);
    expect(r.unit).toBe('m2');
  });

  it('diagonal lay: 14 x 1.15 = 16.1 m2, 8.05 boxes, buy 9', () => {
    const r = calculateFlooring(roomWith('diagonal'));
    expect(r.exactQuantity).toBeCloseTo(16.1, 9);
    expect(r.buyQuantity).toBe(9);
  });

  it('herringbone lay: 14 x 1.20 = 16.8 m2, 8.4 boxes, buy 9', () => {
    const r = calculateFlooring(roomWith('herringbone'));
    expect(r.exactQuantity).toBeCloseTo(16.8, 9);
    expect(r.buyQuantity).toBe(9);
  });

  it('keeps a whole number of boxes when the need fits: 10 m2 with 0% waste is 5 boxes', () => {
    const room = makeRoom({
      lengthM: 5,
      widthM: 2,
      flooring: { ...defaultFlooringOptions('metric'), wastePct: 0 },
    });
    const r = calculateFlooring(room);
    expect(r.buyQuantity).toBe(5);
    expect(r.coveredQuantity).toBe(10);
  });

  it('uses the box size from the options: imperial 20 sq ft box, 15.4 m2 needs 9 boxes', () => {
    // 15.4 m2 / 1.8580608 m2 per box = 8.288 boxes.
    const room = makeRoom({ flooring: defaultFlooringOptions('imperial') });
    const r = calculateFlooring(room);
    expect(r.buyQuantity).toBe(9);
    expect(r.packBreakdown).toHaveLength(1);
  });

  it('never buys less than the exact need', () => {
    for (const pattern of ['straight', 'diagonal', 'herringbone'] as const) {
      const r = calculateFlooring(roomWith(pattern));
      expect(r.coveredQuantity).toBeGreaterThanOrEqual(r.exactQuantity);
    }
  });
});

describe('flooringNeed', () => {
  it('returns the unrounded need and the box size', () => {
    const need = flooringNeed(roomWith('straight'));
    expect(need.exactQuantity).toBeCloseTo(15.4, 9);
    expect(need.packSizes).toEqual([2]);
    expect(need.key).toBe('flooring');
  });
});

import { describe, expect, it } from 'vitest';
import { choosePacks } from '../../src/lib/calc/packSizes';

const METRIC_CANS = [1, 2.5, 5, 10];

describe('choosePacks', () => {
  it('buys one pack when the need fits exactly', () => {
    const r = choosePacks(10, [10]);
    expect(r.totalPacks).toBe(1);
    expect(r.totalQuantity).toBe(10);
    expect(r.packs).toEqual([{ packSize: 10, count: 1 }]);
  });

  it('rounds up a fractional need and keeps the unrounded need', () => {
    const r = choosePacks(2.4, [1]);
    expect(r.totalPacks).toBe(3);
    expect(r.totalQuantity).toBe(3);
    expect(r.exactNeed).toBe(2.4);
  });

  it('rounds up to a single large pack', () => {
    const r = choosePacks(7, [5]);
    expect(r.totalPacks).toBe(2);
    expect(r.totalQuantity).toBe(10);
  });

  it('does not add a pack for floating point noise', () => {
    const r = choosePacks(0.1 + 0.2, [0.3]);
    expect(r.totalPacks).toBe(1);
  });

  it('never returns less than the need', () => {
    for (const need of [0.2, 0.9, 1, 3.3, 7, 12, 18.4, 26.1, 99.9]) {
      const r = choosePacks(need, METRIC_CANS);
      expect(r.totalQuantity).toBeGreaterThanOrEqual(need - 1e-9);
    }
  });

  it('picks the combination with the least leftover: 7 L is 5 + 1 + 1', () => {
    const r = choosePacks(7, METRIC_CANS);
    expect(r.totalQuantity).toBe(7);
    expect(r.packs).toEqual([
      { packSize: 5, count: 1 },
      { packSize: 1, count: 2 },
    ]);
  });

  it('prefers fewer packs when the leftover is the same: 12 L is 10 + 1 + 1', () => {
    const r = choosePacks(12, METRIC_CANS);
    expect(r.totalQuantity).toBe(12);
    expect(r.totalPacks).toBe(3);
    expect(r.packs).toEqual([
      { packSize: 10, count: 1 },
      { packSize: 1, count: 2 },
    ]);
  });

  it('uses a mid-size pack when it fits: 3.5 L is 2.5 + 1', () => {
    const r = choosePacks(3.5, METRIC_CANS);
    expect(r.totalQuantity).toBe(3.5);
    expect(r.totalPacks).toBe(2);
  });

  it('beats a greedy split: 24 L from 10 L and 6 L packs is 4 x 6 L', () => {
    const r = choosePacks(24, [10, 6]);
    // 4 x 6 = 24 beats 2 x 10 + 1 x 6 = 26.
    expect(r.totalQuantity).toBe(24);
    expect(r.packs).toEqual([{ packSize: 6, count: 4 }]);
  });

  it('rounds a tiny need up to the smallest pack', () => {
    const r = choosePacks(0.2, METRIC_CANS);
    expect(r.totalQuantity).toBe(1);
    expect(r.totalPacks).toBe(1);
  });

  it('returns no packs for a need of zero', () => {
    const r = choosePacks(0, METRIC_CANS);
    expect(r.totalPacks).toBe(0);
    expect(r.packs).toEqual([]);
    expect(r.totalQuantity).toBe(0);
  });

  it('ignores the order of pack sizes and repeated sizes', () => {
    expect(choosePacks(7, [5, 1, 10, 2.5, 5])).toEqual(choosePacks(7, METRIC_CANS));
  });

  it('handles a large need quickly', () => {
    const r = choosePacks(1100.3, METRIC_CANS);
    expect(r.totalQuantity).toBeGreaterThanOrEqual(1100.3);
    expect(r.totalQuantity).toBeLessThan(1103);
  });

  it('rejects bad pack sizes and a non-finite need', () => {
    expect(() => choosePacks(1, [])).toThrow(RangeError);
    expect(() => choosePacks(1, [0])).toThrow(RangeError);
    expect(() => choosePacks(1, [-2])).toThrow(RangeError);
    expect(() => choosePacks(Number.NaN, [1])).toThrow(RangeError);
  });
});

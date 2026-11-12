import { describe, expect, it } from 'vitest';
import { estimateCost, formatMoney, totalCost } from '../../src/lib/calc/cost';
import type { MaterialResult } from '../../src/types/calc';

function item(cost: ReturnType<typeof estimateCost>): MaterialResult {
  return {
    key: 'paint',
    label: 'Wall paint',
    unit: 'L',
    buyQuantity: 1,
    exactQuantity: 1,
    coveredQuantity: 1,
    packBreakdown: [],
    cost,
  };
}

describe('formatMoney', () => {
  it('uses the region currency and locale', () => {
    expect(formatMoney(12.5, 'US')).toBe('$12.50');
    expect(formatMoney(12.5, 'UK')).toBe('£12.50');
    expect(formatMoney(1234.5, 'US')).toBe('$1,234.50');
  });
});

describe('estimateCost', () => {
  it('multiplies the covered quantity by the unit price and labels it an estimate', () => {
    const c = estimateCost(21, 10, 'UK');
    expect(c).toEqual({ amount: 210, currency: 'GBP', formatted: '£210.00', label: 'estimate' });
  });
  it('rounds to 2 decimals', () => {
    expect(estimateCost(3, 0.335, 'US')?.amount).toBe(1.01);
  });
  it('returns null when there is no price', () => {
    expect(estimateCost(5, undefined, 'US')).toBeNull();
  });
  it('treats a price of 0 as a real price', () => {
    expect(estimateCost(5, 0, 'US')?.amount).toBe(0);
  });
});

describe('totalCost', () => {
  it('adds the item costs', () => {
    const items = [item(estimateCost(2, 10, 'UK')), item(estimateCost(1, 5.5, 'UK'))];
    expect(totalCost(items, 'UK')?.amount).toBe(25.5);
    expect(totalCost(items, 'UK')?.formatted).toBe('£25.50');
  });
  it('is null when any item has no price', () => {
    expect(totalCost([item(estimateCost(2, 10, 'UK')), item(null)], 'UK')).toBeNull();
  });
  it('is null for an empty list', () => {
    expect(totalCost([], 'UK')).toBeNull();
  });
});

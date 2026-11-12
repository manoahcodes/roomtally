import { describe, expect, it } from 'vitest';
import {
  ceilPacks,
  ceilUp,
  ftToM,
  inToM,
  litresToUkGal,
  litresToUsGal,
  m2ToSqFt,
  mToFt,
  mToIn,
  mmToM,
  mToMm,
  roundTo,
  sqFtToM2,
  ukGalToLitres,
  usGalToLitres,
} from '../../src/lib/calc/units';

describe('length conversions', () => {
  it('converts feet to metres exactly', () => {
    expect(ftToM(10)).toBeCloseTo(3.048, 9);
  });
  it('converts metres to feet', () => {
    expect(mToFt(3.048)).toBeCloseTo(10, 9);
  });
  it('converts inches and millimetres', () => {
    expect(inToM(12)).toBeCloseTo(0.3048, 9);
    expect(mToIn(0.3048)).toBeCloseTo(12, 9);
    expect(mmToM(300)).toBe(0.3);
    expect(mToMm(0.003)).toBe(3);
  });
  it('round-trips metres and feet to 6 decimals', () => {
    for (const m of [0.5, 2.4, 3.5, 12.345678, 100]) {
      expect(roundTo(ftToM(mToFt(m)))).toBe(roundTo(m));
    }
  });
});

describe('area conversions', () => {
  it('converts square feet to square metres', () => {
    expect(sqFtToM2(100)).toBeCloseTo(9.290304, 9);
  });
  it('converts square metres to square feet', () => {
    expect(m2ToSqFt(9.290304)).toBeCloseTo(100, 9);
  });
  it('round-trips area to 6 decimals', () => {
    for (const a of [1, 18.5, 350, 999.999]) {
      expect(roundTo(m2ToSqFt(sqFtToM2(a)))).toBe(roundTo(a));
    }
  });
});

describe('volume conversions', () => {
  it('converts US gallons and litres', () => {
    expect(usGalToLitres(1)).toBeCloseTo(3.785411784, 9);
    expect(litresToUsGal(3.785411784)).toBeCloseTo(1, 9);
  });
  it('converts UK gallons and litres', () => {
    expect(ukGalToLitres(1)).toBeCloseTo(4.54609, 9);
    expect(litresToUkGal(4.54609)).toBeCloseTo(1, 9);
  });
  it('round-trips volume to 6 decimals', () => {
    for (const l of [0.5, 5, 18.927059, 100]) {
      expect(roundTo(usGalToLitres(litresToUsGal(l)))).toBe(roundTo(l));
      expect(roundTo(ukGalToLitres(litresToUkGal(l)))).toBe(roundTo(l));
    }
  });
});

describe('roundTo', () => {
  it('rounds to 6 decimals by default', () => {
    expect(roundTo(1.23456789)).toBe(1.234568);
  });
  it('rounds to a chosen number of decimals', () => {
    expect(roundTo(2.346, 2)).toBe(2.35);
  });
});

describe('ceilUp', () => {
  it('rounds up to a whole number by default', () => {
    expect(ceilUp(2.1)).toBe(3);
  });
  it('keeps an exact whole number', () => {
    expect(ceilUp(3)).toBe(3);
  });
  it('ignores floating point noise just above a whole number', () => {
    expect(ceilUp(3.0000000001)).toBe(3);
  });
  it('rounds up to a multiple of a step', () => {
    expect(ceilUp(7.2, 2.5)).toBe(7.5);
    expect(ceilUp(5, 2.5)).toBe(5);
  });
  it('rejects a step of zero or less', () => {
    expect(() => ceilUp(1, 0)).toThrow(RangeError);
    expect(() => ceilUp(1, -1)).toThrow(RangeError);
  });
});

describe('ceilPacks', () => {
  it('counts whole packs, rounding up', () => {
    expect(ceilPacks(2.4, 1)).toBe(3);
    expect(ceilPacks(18, 9)).toBe(2);
  });
  it('returns 0 when nothing is needed', () => {
    expect(ceilPacks(0, 5)).toBe(0);
    expect(ceilPacks(-1, 5)).toBe(0);
  });
  it('rejects a pack size of zero or less', () => {
    expect(() => ceilPacks(1, 0)).toThrow(RangeError);
  });
});

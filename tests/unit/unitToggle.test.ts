import { describe, expect, it } from 'vitest';
import { createProjectStore } from '../../src/lib/state/projectStore';
import {
  applyRegion,
  applyUnitSystem,
  areaFromDisplay,
  areaToDisplay,
  describeChoice,
  formatArea,
  formatLength,
  formatNumber,
  formatVolume,
  lengthFromDisplay,
  lengthToDisplay,
  volumeFromDisplay,
  volumeToDisplay,
} from '../../src/lib/ui/unitToggle';
import { roundTo } from '../../src/lib/calc/units';
import { createMemoryStorage } from '../helpers/storageMock';
import { makeRoom } from '../helpers/roomFixtures';

const stamp = '2026-01-01T00:00:00.000Z';
function newStore() {
  return createProjectStore({ storage: createMemoryStorage(), now: () => stamp, newId: () => 'r1' });
}

describe('applyRegion', () => {
  it('sets the region and its default unit system', () => {
    const store = newStore();
    expect(applyRegion(store, 'UK')).toBe(true);
    expect(store.getState().settings.region).toBe('UK');
    expect(store.getState().settings.unitSystem).toBe('metric');
  });
  it('US and CA default to imperial, UK and AU to metric', () => {
    const store = newStore();
    for (const [region, unit] of [['CA', 'imperial'], ['AU', 'metric'], ['US', 'imperial']] as const) {
      applyRegion(store, region);
      expect(store.getState().settings.unitSystem).toBe(unit);
    }
  });
  it('does nothing when the region is already set, and rejects an unknown region', () => {
    const store = newStore();
    expect(applyRegion(store, 'US')).toBe(false);
    expect(applyRegion(store, 'FR' as 'US')).toBe(false);
    expect(store.getState().settings.region).toBe('US');
  });
});

describe('applyUnitSystem', () => {
  it('switches units and keeps the region', () => {
    const store = newStore();
    applyRegion(store, 'UK');
    expect(applyUnitSystem(store, 'imperial')).toBe(true);
    expect(store.getState().settings.region).toBe('UK');
    expect(store.getState().settings.unitSystem).toBe('imperial');
  });
  it('does nothing for the same or an invalid unit system', () => {
    const store = newStore();
    expect(applyUnitSystem(store, 'imperial')).toBe(false);
    expect(applyUnitSystem(store, 'cubits' as 'metric')).toBe(false);
  });
  it('never changes the stored room, which stays in metres', () => {
    const store = newStore();
    const { id: _id, createdAt: _c, updatedAt: _u, ...input } = makeRoom({ lengthM: 4, widthM: 3.5 });
    store.addRoom(input);
    applyUnitSystem(store, 'metric');
    applyUnitSystem(store, 'imperial');
    const room = store.getState().rooms[0]!;
    expect(room.lengthM).toBe(4);
    expect(room.widthM).toBe(3.5);
  });
});

describe('describeChoice', () => {
  it('joins region and unit system', () => {
    expect(describeChoice({ region: 'UK', unitSystem: 'metric' })).toBe('UK/metric');
  });
});

describe('display conversions', () => {
  it('shows metres as feet and back', () => {
    expect(lengthToDisplay(3.048, 'imperial')).toBeCloseTo(10, 9);
    expect(lengthFromDisplay(10, 'imperial')).toBeCloseTo(3.048, 9);
    expect(lengthToDisplay(3.048, 'metric')).toBe(3.048);
  });
  it('shows square metres as square feet and back', () => {
    expect(areaToDisplay(9.290304, 'imperial')).toBeCloseTo(100, 9);
    expect(areaFromDisplay(100, 'imperial')).toBeCloseTo(9.290304, 9);
  });
  it('shows litres as US gallons and back', () => {
    expect(volumeToDisplay(3.785411784, 'imperial')).toBeCloseTo(1, 9);
    expect(volumeFromDisplay(1, 'imperial')).toBeCloseTo(3.785411784, 9);
  });
  it('round-trips a typed value without drift to 6 decimals', () => {
    for (const ft of [8, 11.5, 12, 20.25]) {
      expect(roundTo(lengthToDisplay(lengthFromDisplay(ft, 'imperial'), 'imperial'))).toBe(ft);
    }
  });
});

describe('formatting', () => {
  it('formats lengths, areas and volumes with a unit', () => {
    expect(formatLength(3.5, 'metric')).toBe('3.5 m');
    expect(formatLength(3.048, 'imperial')).toBe('10 ft');
    expect(formatArea(14, 'metric')).toBe('14 m²');
    expect(formatArea(9.290304, 'imperial')).toBe('100 sq ft');
    expect(formatVolume(5, 'metric')).toBe('5 L');
    expect(formatVolume(3.785411784, 'imperial')).toBe('1 US gal');
  });
  it('drops trailing zeros and limits decimals', () => {
    expect(formatNumber(2)).toBe('2');
    expect(formatNumber(2.5)).toBe('2.5');
    expect(formatNumber(2.34567)).toBe('2.35');
  });
});

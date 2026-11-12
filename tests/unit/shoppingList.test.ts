import { describe, expect, it } from 'vitest';
import { CalcValidationError } from '../../src/lib/calc/errors';
import { buildShoppingList } from '../../src/lib/calc/shoppingList';
import {
  makeInvalidRoom,
  makeMultiRoomProject,
  makeProject,
  makeRoom,
  makeSettings,
} from '../helpers/roomFixtures';

const PAINT_ONLY = makeSettings({ enabledMaterials: ['paint'] });

describe('buildShoppingList: sum first, round once', () => {
  // Walls: 36 + 33.6 + 28.8 = 98.4 m2. 98.4 x 2 / 10 x 1.05 = 20.664 L.
  const list = buildShoppingList(makeMultiRoomProject(PAINT_ONLY));
  const paint = list.items[0]!;

  it('needs 20.664 L in total', () => {
    expect(paint.exactQuantity).toBeCloseTo(20.664, 6);
  });

  it('buys 21 L as two 10 L cans and one 1 L can: 3 cans', () => {
    expect(paint.coveredQuantity).toBe(21);
    expect(paint.buyQuantity).toBe(3);
    expect(paint.packBreakdown).toEqual([
      { packSize: 10, count: 2 },
      { packSize: 1, count: 1 },
    ]);
  });

  it('buys fewer cans than rounding each room separately (8 cans, 21.5 L)', () => {
    const perRoom = makeMultiRoomProject(PAINT_ONLY).rooms.map(
      (room) => buildShoppingList(makeProject([room], PAINT_ONLY)).items[0]!,
    );
    expect(perRoom.reduce((sum, r) => sum + r.buyQuantity, 0)).toBe(8);
    expect(perRoom.reduce((sum, r) => sum + r.coveredQuantity, 0)).toBeCloseTo(21.5, 9);
    expect(paint.buyQuantity).toBeLessThan(8);
  });

  it('never buys less than the exact need', () => {
    expect(paint.coveredQuantity).toBeGreaterThanOrEqual(paint.exactQuantity);
  });
});

describe('buildShoppingList: materials', () => {
  it('lists only the enabled materials, in a fixed order', () => {
    const list = buildShoppingList(makeProject([makeRoom()], makeSettings()));
    expect(list.items.map((i) => i.key)).toEqual(['paint', 'flooring', 'tile', 'wallpaper']);
    const some = buildShoppingList(
      makeProject([makeRoom()], makeSettings({ enabledMaterials: ['wallpaper', 'flooring'] })),
    );
    expect(some.items.map((i) => i.key)).toEqual(['flooring', 'wallpaper']);
  });

  it('adds ceiling paint and primer lines when switched on', () => {
    const settings = makeSettings({
      enabledMaterials: ['paint'],
      includeCeiling: true,
      includePrimer: true,
    });
    const list = buildShoppingList(makeProject([makeRoom()], settings));
    expect(list.items.map((i) => i.key)).toEqual(['paint', 'ceilingPaint', 'primer']);
  });

  it('sums flooring across rooms: 33 m2 x 1.10 = 36.3 m2, 19 boxes of 2 m2', () => {
    const list = buildShoppingList(
      makeMultiRoomProject(makeSettings({ enabledMaterials: ['flooring'] })),
    );
    expect(list.items[0]!.exactQuantity).toBeCloseTo(36.3, 9);
    expect(list.items[0]!.buyQuantity).toBe(19);
  });

  it('rounds the summed tile count up once', () => {
    const list = buildShoppingList(
      makeMultiRoomProject(makeSettings({ enabledMaterials: ['tile'] })),
    );
    expect(Number.isInteger(list.items[0]!.tilesNeeded)).toBe(true);
  });

  it('returns an empty list for a project with no rooms', () => {
    const list = buildShoppingList(makeProject([], PAINT_ONLY));
    expect(list.items).toEqual([]);
    expect(list.totalCost).toBeNull();
    expect(list.roomCount).toBe(0);
  });
});

describe('buildShoppingList: cost', () => {
  it('prices what you buy: 21 L x 10 = 210.00 for paint', () => {
    const settings = makeSettings({ enabledMaterials: ['paint'], prices: { paint: 10 } });
    const list = buildShoppingList(makeMultiRoomProject(settings));
    expect(list.items[0]!.cost?.formatted).toBe('£210.00');
    expect(list.totalCost?.amount).toBe(210);
  });

  it('shows no cost without a price, and no total unless every item is priced', () => {
    const none = buildShoppingList(makeMultiRoomProject(PAINT_ONLY));
    expect(none.items[0]!.cost).toBeNull();
    expect(none.totalCost).toBeNull();
    const partial = buildShoppingList(
      makeProject(
        [makeRoom()],
        makeSettings({ enabledMaterials: ['paint', 'flooring'], prices: { paint: 10 } }),
      ),
    );
    expect(partial.items[0]!.cost).not.toBeNull();
    expect(partial.items[1]!.cost).toBeNull();
    expect(partial.totalCost).toBeNull();
  });
});

describe('buildShoppingList: assumptions panel', () => {
  it('shows paint coverage, coats, spare and can sizes in metric', () => {
    const { assumptions } = buildShoppingList(makeProject([makeRoom()], PAINT_ONLY));
    const byId = Object.fromEntries(assumptions.map((a) => [a.id, a.value]));
    expect(byId['paint.coverage']).toBe('10 m² per litre');
    expect(byId['paint.coats']).toBe('2');
    expect(byId['paint.spare']).toBe('5%');
    expect(byId['paint.packs']).toBe('1, 2.5, 5, 10 L');
  });

  it('shows only the values of enabled materials', () => {
    const { assumptions } = buildShoppingList(makeProject([makeRoom()], PAINT_ONLY));
    expect(assumptions.every((a) => a.id.startsWith('paint.'))).toBe(true);
  });

  it('names the room when two rooms use different values', () => {
    const a = makeRoom({ id: 'a', name: 'Bedroom' });
    const b = makeRoom({ id: 'b', name: 'Hall', paint: { ...a.paint, coats: 3 } });
    const { assumptions } = buildShoppingList(makeProject([a, b], PAINT_ONLY));
    const coats = assumptions.filter((x) => x.id.startsWith('paint.coats'));
    expect(coats.map((x) => x.label)).toEqual(['Paint coats (Bedroom)', 'Paint coats (Hall)']);
  });

  it('marks an overridden preset', () => {
    const settings = makeSettings({ enabledMaterials: ['paint'], overrides: { 'paint.coats': 3 } });
    const { assumptions } = buildShoppingList(makeProject([makeRoom()], settings));
    expect(assumptions.find((x) => x.id === 'paint.coats')?.overridden).toBe(true);
    expect(assumptions.find((x) => x.id === 'paint.spare')?.overridden).toBe(false);
  });
});

describe('buildShoppingList: errors', () => {
  it('throws CALC_003 for more than 10 rooms', () => {
    const rooms = Array.from({ length: 11 }, (_, i) => makeRoom({ id: `r${i}` }));
    expect(() => buildShoppingList(makeProject(rooms))).toThrow(CalcValidationError);
    try {
      buildShoppingList(makeProject(rooms));
    } catch (error) {
      expect((error as CalcValidationError).code).toBe('CALC_003');
    }
  });

  it('throws for an invalid room and returns no partial list', () => {
    const project = makeProject([makeRoom(), makeInvalidRoom('lengthTooSmall')]);
    expect(() => buildShoppingList(project)).toThrow(CalcValidationError);
  });
});

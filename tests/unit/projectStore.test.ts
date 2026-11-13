import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalcValidationError } from '../../src/lib/calc/errors';
import type { ErrorCode } from '../../src/lib/calc/errors';
import { createDefaultRoomInput, createProjectStore } from '../../src/lib/state/projectStore';
import type { RoomInput } from '../../src/lib/state/projectStore';
import { PROJECT_KEY, createEmptyProject } from '../../src/lib/state/storage';
import { createFailingStorage, createFullStorage, createMemoryStorage } from '../helpers/storageMock';
import { makeProject, makeRoom } from '../helpers/roomFixtures';

let tick = 0;
const now = (): string => new Date(Date.UTC(2026, 0, 1, 0, 0, tick++)).toISOString();
let idCounter = 0;
const newId = (): string => `room-${++idCounter}`;

function newStore(storage = createMemoryStorage()) {
  const store = createProjectStore({ storage, now, newId });
  return { store, storage };
}

function input(overrides: Partial<RoomInput> = {}): RoomInput {
  return { ...createDefaultRoomInput(createEmptyProject().settings, 0), ...overrides };
}

function codeOf(fn: () => unknown): ErrorCode | null {
  try {
    fn();
    return null;
  } catch (error) {
    if (error instanceof CalcValidationError) return error.code;
    throw error;
  }
}

beforeEach(() => {
  tick = 0;
  idCounter = 0;
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('starting state', () => {
  it('starts empty with no notice when nothing is saved', () => {
    const { store } = newStore();
    expect(store.getState().rooms).toEqual([]);
    expect(store.getNotice()).toBeNull();
  });

  it('loads a saved project', () => {
    const saved = makeProject([makeRoom({ id: 'saved-1', name: 'Kitchen' })]);
    const storage = createMemoryStorage({ [PROJECT_KEY]: JSON.stringify(saved) });
    const { store } = newStore(storage);
    expect(store.getState().rooms.map((r) => r.name)).toEqual(['Kitchen']);
    expect(store.getNotice()).toBeNull();
  });
});

describe('addRoom', () => {
  it('assigns an id and timestamps and returns the room', () => {
    const { store } = newStore();
    const room = store.addRoom(input({ name: 'Bedroom' }));
    expect(room.id).toBe('room-1');
    expect(room.name).toBe('Bedroom');
    expect(room.createdAt).toBe(room.updatedAt);
    expect(store.getState().rooms).toHaveLength(1);
  });

  it('allows 10 rooms and rejects the 11th with CALC_003', () => {
    const { store } = newStore();
    for (let i = 0; i < 10; i += 1) store.addRoom(input({ name: `Room ${i + 1}` }));
    expect(codeOf(() => store.addRoom(input()))).toBe('CALC_003');
    expect(store.getState().rooms).toHaveLength(10);
  });

  it('rejects an invalid room and leaves the project unchanged', () => {
    const { store, storage } = newStore();
    expect(codeOf(() => store.addRoom(input({ lengthM: 0.4 })))).toBe('CALC_001');
    expect(codeOf(() => store.addRoom(input({ widthM: Number.NaN })))).toBe('CALC_007');
    expect(store.getState().rooms).toEqual([]);
    vi.advanceTimersByTime(1000);
    expect(storage.data.has(PROJECT_KEY)).toBe(false);
  });
});

describe('persistence', () => {
  it('saves 300 ms after the last change, not before', () => {
    const { store, storage } = newStore();
    store.addRoom(input());
    vi.advanceTimersByTime(299);
    expect(storage.data.has(PROJECT_KEY)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(storage.data.has(PROJECT_KEY)).toBe(true);
  });

  it('restarts the pause on each change and saves once', () => {
    const { store, storage } = newStore();
    const spy = vi.spyOn(storage, 'setItem');
    store.addRoom(input());
    vi.advanceTimersByTime(200);
    store.addRoom(input({ name: 'Second' }));
    vi.advanceTimersByTime(200);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('flush saves immediately', () => {
    const { store, storage } = newStore();
    store.addRoom(input());
    store.flush();
    expect(storage.data.has(PROJECT_KEY)).toBe(true);
  });

  it('what is saved loads back in a new store', () => {
    const { store, storage } = newStore();
    store.addRoom(input({ name: 'Study' }));
    store.flush();
    const { store: again } = newStore(storage);
    expect(again.getState().rooms.map((r) => r.name)).toEqual(['Study']);
  });

  it('sets STO_001 when saving fails, and keeps working in memory', () => {
    const { store } = newStore(createFullStorage());
    store.addRoom(input());
    store.flush();
    expect(store.getNotice()).toBe('STO_001');
    expect(store.getState().rooms).toHaveLength(1);
  });

  it('starts with STO_001 and works in memory when storage is unavailable', () => {
    const store = createProjectStore({ storage: createFailingStorage(), now, newId });
    expect(store.getNotice()).toBe('STO_001');
    store.addRoom(input());
    store.flush();
    expect(store.getState().rooms).toHaveLength(1);
    const none = createProjectStore({ storage: null, now, newId });
    expect(none.getNotice()).toBe('STO_001');
  });
});

describe('updateRoom', () => {
  it('changes the fields and updates updatedAt but not createdAt or id', () => {
    const { store } = newStore();
    const added = store.addRoom(input());
    const updated = store.updateRoom(added.id, { name: 'Hall', lengthM: 5 });
    expect(updated.name).toBe('Hall');
    expect(updated.lengthM).toBe(5);
    expect(updated.id).toBe(added.id);
    expect(updated.createdAt).toBe(added.createdAt);
    expect(updated.updatedAt).not.toBe(added.updatedAt);
  });

  it('cannot change the id or createdAt through a patch', () => {
    const { store } = newStore();
    const added = store.addRoom(input());
    const patch = { id: 'hacked', createdAt: '1999-01-01T00:00:00.000Z' } as Partial<RoomInput>;
    const updated = store.updateRoom(added.id, patch);
    expect(updated.id).toBe(added.id);
    expect(updated.createdAt).toBe(added.createdAt);
  });

  it('rejects an invalid patch and keeps the old room', () => {
    const { store } = newStore();
    const added = store.addRoom(input());
    expect(codeOf(() => store.updateRoom(added.id, { heightM: 9 }))).toBe('CALC_001');
    expect(store.getState().rooms[0]!.heightM).toBe(added.heightM);
  });

  it('throws for an unknown id', () => {
    const { store } = newStore();
    expect(() => store.updateRoom('nope', { name: 'x' })).toThrow(RangeError);
  });
});

describe('removeRoom', () => {
  it('removes a room and says whether it did', () => {
    const { store } = newStore();
    const a = store.addRoom(input({ name: 'A' }));
    store.addRoom(input({ name: 'B' }));
    expect(store.removeRoom(a.id)).toBe(true);
    expect(store.removeRoom(a.id)).toBe(false);
    expect(store.getState().rooms.map((r) => r.name)).toEqual(['B']);
  });
});

describe('setSettings', () => {
  it('merges valid changes', () => {
    const { store } = newStore();
    const settings = store.setSettings({ includeCeiling: true, prices: { paint: 12.5 } });
    expect(settings.includeCeiling).toBe(true);
    expect(settings.prices).toEqual({ paint: 12.5 });
    expect(store.getState().settings.region).toBe('US');
  });

  it('rejects invalid settings and keeps the old ones', () => {
    const { store } = newStore();
    expect(codeOf(() => store.setSettings({ prices: { paint: -1 } }))).toBe('CALC_006');
    expect(codeOf(() => store.setSettings({ region: 'FR' as 'US' }))).toBe('CALC_001');
    expect(store.getState().settings.prices).toEqual({});
  });
});

describe('subscribe', () => {
  it('calls listeners after each change and stops after unsubscribe', () => {
    const { store } = newStore();
    const listener = vi.fn();
    const stop = store.subscribe(listener);
    const room = store.addRoom(input());
    store.updateRoom(room.id, { name: 'X' });
    store.removeRoom(room.id);
    expect(listener).toHaveBeenCalledTimes(3);
    stop();
    store.addRoom(input());
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('does not call listeners for a rejected change', () => {
    const { store } = newStore();
    const listener = vi.fn();
    store.subscribe(listener);
    expect(() => store.addRoom(input({ lengthM: -1 }))).toThrow();
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps notifying the others when one listener throws', () => {
    const { store } = newStore();
    const good = vi.fn();
    store.subscribe(() => {
      throw new Error('broken');
    });
    store.subscribe(good);
    store.addRoom(input());
    expect(good).toHaveBeenCalledTimes(1);
  });
});

describe('clearMyData', () => {
  it('deletes the saved project, resets the state and cancels a pending save', () => {
    const { store, storage } = newStore();
    store.setSettings({ prices: { paint: 9 } });
    store.addRoom(input());
    store.flush();
    store.addRoom(input({ name: 'Pending' }));
    store.clearMyData();
    vi.advanceTimersByTime(1000);
    expect(storage.data.has(PROJECT_KEY)).toBe(false);
    expect(store.getState().rooms).toEqual([]);
    expect(store.getState().settings.prices).toEqual({});
    expect(store.getNotice()).toBeNull();
  });
});

describe('notice', () => {
  it('can be dismissed', () => {
    const store = createProjectStore({ storage: null, now, newId });
    const listener = vi.fn();
    store.subscribe(listener);
    store.dismissNotice();
    expect(store.getNotice()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    store.dismissNotice();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('tampered data', () => {
  it('tampered saved data resets to an empty project with STO_002', () => {
    const bad = JSON.parse(JSON.stringify(makeProject([makeRoom()])));
    bad.rooms[0].lengthM = -4;
    const storage = createMemoryStorage({ [PROJECT_KEY]: JSON.stringify(bad) });
    const { store } = newStore(storage);
    expect(store.getState().rooms).toEqual([]);
    expect(store.getNotice()).toBe('STO_002');
    expect(storage.data.has(PROJECT_KEY)).toBe(false);
  });

  it('tampered saved settings reset to an empty project', () => {
    const bad = JSON.parse(JSON.stringify(makeProject()));
    bad.settings.prices = { paint: 1e9 };
    const { store } = newStore(createMemoryStorage({ [PROJECT_KEY]: JSON.stringify(bad) }));
    expect(store.getNotice()).toBe('STO_002');
    expect(store.getState().settings.prices).toEqual({});
  });

  it('tampered input with unknown fields is cleaned before it is stored', () => {
    const { store, storage } = newStore();
    const dirty = { ...input(), admin: true, script: '<script>1</script>' } as RoomInput;
    store.addRoom(dirty);
    store.flush();
    const saved = JSON.parse(storage.data.get(PROJECT_KEY)!);
    expect(saved.rooms[0]).not.toHaveProperty('admin');
    expect(saved.rooms[0]).not.toHaveProperty('script');
  });

  it('tampered patches with bad numbers are rejected and change nothing', () => {
    const { store } = newStore();
    const room = store.addRoom(input());
    const before = JSON.stringify(store.getState());
    for (const patch of [
      { lengthM: -1 },
      { widthM: '5' as unknown as number },
      { heightM: Infinity },
      { name: 'x'.repeat(5000) },
      { paint: { ...room.paint, coats: 99 } },
      { flooring: { ...room.flooring, wastePct: -5 } },
    ] as Partial<RoomInput>[]) {
      expect(() => store.updateRoom(room.id, patch)).toThrow(CalcValidationError);
    }
    expect(JSON.stringify(store.getState())).toBe(before);
  });

  it('tampered changes to a returned copy do not reach the store', () => {
    const { store } = newStore();
    store.addRoom(input({ name: 'Safe' }));
    const copy = store.getState();
    copy.rooms[0]!.name = 'Changed';
    copy.rooms[0]!.lengthM = -99;
    expect(store.getState().rooms[0]!.name).toBe('Safe');
    expect(store.getState().rooms[0]!.lengthM).toBe(4);
  });

  it('tampered duplicate opening ids are rejected', () => {
    const { store } = newStore();
    const opening = { id: 'same', kind: 'door' as const, widthM: 0.9, heightM: 2, count: 1 };
    expect(() => store.addRoom(input({ openings: [opening, { ...opening }] }))).toThrow(
      CalcValidationError,
    );
    expect(store.getState().rooms).toEqual([]);
  });
});

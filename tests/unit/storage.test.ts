import { describe, expect, it } from 'vitest';
import { MIGRATIONS, migrate } from '../../src/lib/state/migrations';
import type { Migration } from '../../src/lib/state/migrations';
import {
  MAX_STORED_CHARS,
  PROJECT_KEY,
  THEME_KEY,
  clearProject,
  createEmptyProject,
  readProject,
  readTheme,
  writeProject,
  writeTheme,
} from '../../src/lib/state/storage';
import { createFailingStorage, createFullStorage, createMemoryStorage } from '../helpers/storageMock';
import { makeProject, makeRoom, makeRoomWithOpenings } from '../helpers/roomFixtures';

/** A saved project as plain JSON that a test can tamper with. */
function saved(): { rooms: Record<string, unknown>[]; [key: string]: unknown } {
  return JSON.parse(JSON.stringify(makeProject([makeRoomWithOpenings()])));
}

function storageWith(value: unknown) {
  return createMemoryStorage({ [PROJECT_KEY]: typeof value === 'string' ? value : JSON.stringify(value) });
}

describe('readProject: empty and valid', () => {
  it('returns an empty project when nothing is saved', () => {
    const r = readProject(createMemoryStorage());
    expect(r.status).toBe('empty');
    expect(r.notice).toBeNull();
    expect(r.project.rooms).toEqual([]);
  });

  it('round-trips a saved project', () => {
    const storage = createMemoryStorage();
    const project = makeProject([makeRoomWithOpenings()]);
    expect(writeProject(project, storage)).toEqual({ ok: true });
    const r = readProject(storage);
    expect(r.status).toBe('loaded');
    expect(r.notice).toBeNull();
    expect(r.project).toEqual(project);
  });

  it('stores under the documented key', () => {
    const storage = createMemoryStorage();
    writeProject(makeProject(), storage);
    expect(PROJECT_KEY).toBe('roomtally:project:v1');
    expect(storage.data.has('roomtally:project:v1')).toBe(true);
  });
});

describe('readProject: corrupt data resets with STO_002', () => {
  it.each([
    ['broken JSON', '{not json'],
    ['empty string', ''],
    ['a bare string', '"hello"'],
    ['null', 'null'],
    ['an array', '[]'],
    ['a number', '42'],
  ])('%s', (_name, raw) => {
    const storage = storageWith(raw);
    const r = readProject(storage);
    expect(r.status).toBe('reset');
    expect(r.notice).toBe('STO_002');
    expect(r.project.rooms).toEqual([]);
    // The bad value is removed so the notice does not repeat on every load.
    expect(storage.data.has(PROJECT_KEY)).toBe(false);
  });
});

describe('readProject: tampered data resets with STO_002', () => {
  const cases: [string, (p: ReturnType<typeof saved>) => void][] = [
    ['a negative length', (p) => void (p.rooms[0]!.lengthM = -4)],
    ['a zero width', (p) => void (p.rooms[0]!.widthM = 0)],
    ['a number stored as text', (p) => void (p.rooms[0]!.lengthM = '4')],
    ['a null number (what NaN becomes in JSON)', (p) => void (p.rooms[0]!.heightM = null)],
    ['a huge number', (p) => void (p.rooms[0]!.lengthM = 1e308)],
    ['coats of 99', (p) => void ((p.rooms[0]!.paint as Record<string, unknown>).coats = 99)],
    ['waste of -5', (p) => void ((p.rooms[0]!.flooring as Record<string, unknown>).wastePct = -5)],
    ['a 5000 character room name', (p) => void (p.rooms[0]!.name = 'x'.repeat(5000))],
    ['a name that is not text', (p) => void (p.rooms[0]!.name = { a: 1 })],
    ['a missing options block', (p) => void delete p.rooms[0]!.tile],
    ['an unknown region', (p) => void ((p.settings as Record<string, unknown>).region = 'XX')],
    ['a negative price', (p) => void ((p.settings as Record<string, unknown>).prices = { paint: -3 })],
    ['an unknown price key', (p) => void ((p.settings as Record<string, unknown>).prices = { gold: 3 })],
    ['a newer schema version', (p) => void (p.schemaVersion = 2)],
    ['schema version 0', (p) => void (p.schemaVersion = 0)],
    ['a text schema version', (p) => void (p.schemaVersion = '1')],
    ['rooms that are not a list', (p) => void ((p as Record<string, unknown>).rooms = 'many')],
    ['a bad date', (p) => void (p.createdAt = 'yesterday')],
    ['11 rooms', (p) => void (p.rooms = Array.from({ length: 11 }, (_, i) => ({ ...p.rooms[0], id: `r${i}` })))],
  ];
  it.each(cases)('%s', (_name, tamper) => {
    const project = saved();
    tamper(project);
    const r = readProject(storageWith(project));
    expect(r.status).toBe('reset');
    expect(r.notice).toBe('STO_002');
    expect(r.project.rooms).toEqual([]);
  });

  it('drops unknown fields instead of keeping them', () => {
    const project = saved();
    project.admin = true;
    project.rooms[0]!.script = '<script>alert(1)</script>';
    const r = readProject(storageWith(project));
    expect(r.status).toBe('loaded');
    expect(r.project).not.toHaveProperty('admin');
    expect(r.project.rooms[0]).not.toHaveProperty('script');
  });

  it('keeps markup in a room name as plain text, never interpreting it', () => {
    const name = '<img src=x onerror=alert(1)>';
    const r = readProject(storageWith(makeProject([makeRoom({ name })])));
    expect(r.status).toBe('loaded');
    expect(r.project.rooms[0]!.name).toBe(name);
  });

  it('does not let a __proto__ key change object prototypes', () => {
    const raw = JSON.stringify(makeProject()).replace(
      '"overrides":{}',
      '"overrides":{"__proto__":{"polluted":1}}',
    );
    readProject(storageWith(raw));
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('readProject: oversized data', () => {
  it('resets without reading a value over the size limit', () => {
    const storage = storageWith('x'.repeat(MAX_STORED_CHARS + 1));
    const r = readProject(storage);
    expect(r.status).toBe('reset');
    expect(r.notice).toBe('STO_002');
  });
});

describe('readProject: storage unavailable', () => {
  it('returns an empty project and STO_001 when every call throws', () => {
    const r = readProject(createFailingStorage());
    expect(r.status).toBe('unavailable');
    expect(r.notice).toBe('STO_001');
    expect(r.project.rooms).toEqual([]);
  });

  it('returns STO_001 when there is no storage at all', () => {
    const r = readProject(null);
    expect(r.status).toBe('unavailable');
    expect(r.notice).toBe('STO_001');
  });

  it('still resets when the bad value cannot be removed', () => {
    const storage = storageWith('{bad');
    storage.removeItem = () => {
      throw new Error('nope');
    };
    expect(readProject(storage).status).toBe('reset');
  });
});

describe('writeProject and clearProject', () => {
  it('returns STO_001 when storage throws or is full', () => {
    expect(writeProject(makeProject(), createFailingStorage())).toEqual({ ok: false, notice: 'STO_001' });
    expect(writeProject(makeProject(), createFullStorage())).toEqual({ ok: false, notice: 'STO_001' });
    expect(writeProject(makeProject(), null)).toEqual({ ok: false, notice: 'STO_001' });
  });

  it('refuses to write a document over the size limit', () => {
    const storage = createMemoryStorage();
    const huge = makeProject([makeRoom({ name: 'x'.repeat(MAX_STORED_CHARS) })]);
    expect(writeProject(huge, storage)).toEqual({ ok: false, notice: 'STO_001' });
    expect(storage.data.size).toBe(0);
  });

  it('clears the saved project', () => {
    const storage = createMemoryStorage();
    writeProject(makeProject(), storage);
    expect(clearProject(storage)).toBe(true);
    expect(storage.data.has(PROJECT_KEY)).toBe(false);
    expect(clearProject(createFailingStorage())).toBe(false);
    expect(clearProject(null)).toBe(false);
  });
});

describe('createEmptyProject', () => {
  it('uses the region unit system and turns every material on', () => {
    const us = createEmptyProject('2026-01-01T00:00:00.000Z', 'US');
    const uk = createEmptyProject('2026-01-01T00:00:00.000Z', 'UK');
    expect(us.settings.unitSystem).toBe('imperial');
    expect(uk.settings.unitSystem).toBe('metric');
    expect(us.settings.enabledMaterials).toEqual(['paint', 'flooring', 'tile', 'wallpaper']);
    expect(us.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('theme preference', () => {
  it('defaults to light and only accepts the exact value "dark"', () => {
    expect(readTheme(createMemoryStorage())).toBe('light');
    expect(readTheme(createMemoryStorage({ [THEME_KEY]: 'dark' }))).toBe('dark');
    expect(readTheme(createMemoryStorage({ [THEME_KEY]: 'DARK' }))).toBe('light');
    expect(readTheme(createMemoryStorage({ [THEME_KEY]: '<b>' }))).toBe('light');
  });
  it('saves and survives unavailable storage', () => {
    const storage = createMemoryStorage();
    expect(writeTheme('dark', storage)).toBe(true);
    expect(storage.data.get(THEME_KEY)).toBe('dark');
    expect(readTheme(createFailingStorage())).toBe('light');
    expect(writeTheme('dark', createFailingStorage())).toBe(false);
    expect(readTheme(null)).toBe('light');
  });
});

describe('migrate', () => {
  const to2: Migration = (d) => ({ ...d, schemaVersion: 2, added: true });
  const to3: Migration = (d) => ({ ...d, schemaVersion: 3, moreAdded: true });

  it('has no migrations yet, and passes current data through unchanged', () => {
    expect(Object.keys(MIGRATIONS)).toHaveLength(0);
    const data = { schemaVersion: 1, a: 1 };
    expect(migrate(data)).toBe(data);
  });

  it('runs the chain in order from an older version', () => {
    expect(migrate({ schemaVersion: 1 }, { 1: to2, 2: to3 }, 3)).toEqual({
      schemaVersion: 3,
      added: true,
      moreAdded: true,
    });
    expect(migrate({ schemaVersion: 2 }, { 1: to2, 2: to3 }, 3)).toEqual({
      schemaVersion: 3,
      moreAdded: true,
    });
  });

  it('returns null for a newer version than the code knows', () => {
    expect(migrate({ schemaVersion: 2 })).toBeNull();
  });

  it('returns null for a gap in the chain', () => {
    expect(migrate({ schemaVersion: 1 }, { 2: to3 }, 3)).toBeNull();
  });

  it('returns null when a migration throws or does not advance the version', () => {
    const boom: Migration = () => {
      throw new Error('bad');
    };
    const stuck: Migration = (d) => ({ ...d });
    expect(migrate({ schemaVersion: 1 }, { 1: boom }, 2)).toBeNull();
    expect(migrate({ schemaVersion: 1 }, { 1: stuck }, 2)).toBeNull();
  });

  it.each([null, 'x', 5, [], {}, { schemaVersion: 0 }, { schemaVersion: 1.5 }, { schemaVersion: '1' }])(
    'returns null for unusable input %j',
    (input) => {
      expect(migrate(input)).toBeNull();
    },
  );
});

import {
  defaultFlooringOptions,
  defaultPaintOptions,
  defaultTileOptions,
  defaultWallpaperOptions,
} from '../../src/data/materials';
import { SCHEMA_VERSION } from '../../src/types/project';
import type { Opening, Project, Room, Settings } from '../../src/types/project';

export const FIXED_TIME = '2026-01-01T00:00:00.000Z';

/** Every call returns fresh objects, so tests never share mutable state. */
export function makeOpening(overrides: Partial<Opening> = {}): Opening {
  return { id: 'op-1', kind: 'door', widthM: 0.9, heightM: 2, count: 1, ...overrides };
}

export function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'room-1',
    name: 'Room 1',
    lengthM: 4,
    widthM: 3.5,
    heightM: 2.4,
    openings: [],
    paint: defaultPaintOptions('metric'),
    flooring: defaultFlooringOptions('metric'),
    tile: defaultTileOptions('metric'),
    wallpaper: defaultWallpaperOptions('metric'),
    createdAt: FIXED_TIME,
    updatedAt: FIXED_TIME,
    ...overrides,
  };
}

/** 4 x 3.5 x 2.4 m with one door (0.9 x 2.0) and one window (1.2 x 1.2). */
export function makeRoomWithOpenings(overrides: Partial<Room> = {}): Room {
  return makeRoom({
    openings: [
      makeOpening({ id: 'op-door', kind: 'door', widthM: 0.9, heightM: 2, count: 1 }),
      makeOpening({ id: 'op-window', kind: 'window', widthM: 1.2, heightM: 1.2, count: 1 }),
    ],
    ...overrides,
  });
}

export function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    region: 'UK',
    unitSystem: 'metric',
    includeCeiling: false,
    includePrimer: false,
    enabledMaterials: ['paint', 'flooring', 'tile', 'wallpaper'],
    prices: {},
    overrides: {},
    ...overrides,
  };
}

export function makeProject(rooms: Room[] = [makeRoom()], settings: Settings = makeSettings()): Project {
  return {
    schemaVersion: SCHEMA_VERSION,
    rooms,
    settings,
    createdAt: FIXED_TIME,
    updatedAt: FIXED_TIME,
  };
}

/** Three rooms with different ids, for multi-room total tests. */
export function makeMultiRoomProject(settings: Settings = makeSettings()): Project {
  return makeProject(
    [
      makeRoom({ id: 'room-a', name: 'Bedroom', lengthM: 4, widthM: 3.5 }),
      makeRoom({ id: 'room-b', name: 'Hall', lengthM: 5, widthM: 2 }),
      makeRoom({ id: 'room-c', name: 'Study', lengthM: 3, widthM: 3 }),
    ],
    settings,
  );
}

export type InvalidRoomKind =
  | 'lengthTooSmall'
  | 'lengthTooLarge'
  | 'widthNaN'
  | 'widthEmpty'
  | 'heightTooLow'
  | 'heightTooHigh'
  | 'openingsTooBig'
  | 'tooManyOpenings'
  | 'coatsZero'
  | 'coatsFive'
  | 'wasteNegative'
  | 'wasteTooHigh';

export function makeInvalidRoom(kind: InvalidRoomKind): Room {
  switch (kind) {
    case 'lengthTooSmall':
      return makeRoom({ lengthM: 0.4 });
    case 'lengthTooLarge':
      return makeRoom({ lengthM: 100.1 });
    case 'widthNaN':
      return makeRoom({ widthM: Number.NaN });
    case 'widthEmpty':
      return makeRoom({ widthM: '' as unknown as number });
    case 'heightTooLow':
      return makeRoom({ heightM: 1.4 });
    case 'heightTooHigh':
      return makeRoom({ heightM: 6.1 });
    case 'openingsTooBig':
      // 4 x 3.5 x 2.4 has 36 m2 of wall. Ten doors of 0.9 x 2.0 are 18 m2, so use two rows of 10.
      return makeRoom({
        openings: [
          makeOpening({ id: 'a', widthM: 5, heightM: 3, count: 10 }),
          makeOpening({ id: 'b', widthM: 5, heightM: 3, count: 10 }),
        ],
      });
    case 'tooManyOpenings':
      return makeRoom({
        openings: Array.from({ length: 21 }, (_, i) =>
          makeOpening({ id: `op-${i}`, widthM: 0.2, heightM: 0.2 }),
        ),
      });
    case 'coatsZero':
      return makeRoom({ paint: { ...defaultPaintOptions('metric'), coats: 0 } });
    case 'coatsFive':
      return makeRoom({ paint: { ...defaultPaintOptions('metric'), coats: 5 } });
    case 'wasteNegative':
      return makeRoom({ flooring: { ...defaultFlooringOptions('metric'), wastePct: -1 } });
    case 'wasteTooHigh':
      return makeRoom({ flooring: { ...defaultFlooringOptions('metric'), wastePct: 31 } });
  }
}

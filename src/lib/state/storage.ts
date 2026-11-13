/**
 * Safe localStorage wrapper (TDD §D.26, Backend_Schema §4).
 * Every access is inside try/catch. Stored data is untrusted: it is parsed,
 * migrated and then validated field by field before it is used. Anything that
 * fails resets to an empty project. Messages are error codes only, never stored data.
 */
import { REGIONS } from '../../data/regions';
import { SCHEMA_VERSION } from '../../types/project';
import type { Project, Region } from '../../types/project';
import type { ErrorCode } from '../calc/errors';
import { sanitizeProject } from '../calc/validation';
import { migrate } from './migrations';

export const PROJECT_KEY = 'roomtally:project:v1';
export const THEME_KEY = 'roomtally:theme';
/** The document stays under 50 KB in normal use; anything over twice that is rejected unread. */
export const MAX_STORED_CHARS = 100 * 1024;

export type ThemePreference = 'light' | 'dark';

/** The small part of the Storage interface this app uses. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** The browser's localStorage, or null when it is missing or access throws. */
export function getBrowserStorage(): StorageLike | null {
  try {
    return (globalThis as { localStorage?: StorageLike }).localStorage ?? null;
  } catch {
    return null;
  }
}

/** A new empty project with default settings for a region. */
export function createEmptyProject(
  now: string = new Date().toISOString(),
  region: Region = 'US',
): Project {
  return {
    schemaVersion: SCHEMA_VERSION,
    rooms: [],
    settings: {
      region,
      unitSystem: REGIONS[region].unitSystem,
      includeCeiling: false,
      includePrimer: false,
      enabledMaterials: ['paint', 'flooring', 'tile', 'wallpaper'],
      prices: {},
      overrides: {},
    },
    createdAt: now,
    updatedAt: now,
  };
}

export interface ReadResult {
  /** Always a usable project: the saved one, or an empty one. */
  project: Project;
  /**
   * empty: nothing saved. loaded: saved project is valid.
   * reset: saved data was unusable and was cleared. unavailable: storage cannot be used.
   */
  status: 'empty' | 'loaded' | 'reset' | 'unavailable';
  /** STO_001 when saving is not possible, STO_002 when saved data was reset, else null. */
  notice: ErrorCode | null;
}

function tryRemove(storage: StorageLike, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Nothing more to do; the next load will reset again.
  }
}

/** Read, migrate and validate the saved project. Never throws. */
export function readProject(
  storage: StorageLike | null = getBrowserStorage(),
  now?: string,
): ReadResult {
  const fresh = (): Project => createEmptyProject(now);
  if (!storage) return { project: fresh(), status: 'unavailable', notice: 'STO_001' };

  let raw: string | null;
  try {
    raw = storage.getItem(PROJECT_KEY);
  } catch {
    return { project: fresh(), status: 'unavailable', notice: 'STO_001' };
  }
  if (raw === null) return { project: fresh(), status: 'empty', notice: null };

  const reset = (): ReadResult => {
    tryRemove(storage, PROJECT_KEY);
    return { project: fresh(), status: 'reset', notice: 'STO_002' };
  };

  if (typeof raw !== 'string' || raw.length > MAX_STORED_CHARS) return reset();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return reset();
  }

  const migrated = migrate(parsed);
  if (migrated === null) return reset();
  const project = sanitizeProject(migrated);
  if (project === null) return reset();
  return { project, status: 'loaded', notice: null };
}

export type WriteResult = { ok: true } | { ok: false; notice: 'STO_001' };

/** Save the project. Never throws; a failure returns STO_001. */
export function writeProject(
  project: Project,
  storage: StorageLike | null = getBrowserStorage(),
): WriteResult {
  if (!storage) return { ok: false, notice: 'STO_001' };
  try {
    const json = JSON.stringify(project);
    if (json.length > MAX_STORED_CHARS) return { ok: false, notice: 'STO_001' };
    storage.setItem(PROJECT_KEY, json);
    return { ok: true };
  } catch {
    return { ok: false, notice: 'STO_001' };
  }
}

/** Remove the saved project. Returns false when storage could not be used. */
export function clearProject(storage: StorageLike | null = getBrowserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(PROJECT_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Light unless the stored value is exactly "dark" (Design_Brief: light is the default). */
export function readTheme(storage: StorageLike | null = getBrowserStorage()): ThemePreference {
  if (!storage) return 'light';
  try {
    return storage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function writeTheme(
  theme: ThemePreference,
  storage: StorageLike | null = getBrowserStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

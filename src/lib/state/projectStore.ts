/**
 * The one place the project lives while the page is open (TDD §B.8).
 * Every write is validated through validation.ts, cleaned of unknown fields, and
 * saved through storage.ts after a 300 ms pause (Backend_Schema §6).
 * Invalid input throws CalcValidationError and leaves the project unchanged.
 */
import {
  DEFAULT_HEIGHT_M,
  defaultFlooringOptions,
  defaultPaintOptions,
  defaultTileOptions,
  defaultWallpaperOptions,
} from '../../data/materials';
import type { Project, Room, Settings } from '../../types/project';
import { CalcValidationError } from '../calc/errors';
import type { ErrorCode } from '../calc/errors';
import { LIMITS, sanitizeProject, validateRoom, validateSettings } from '../calc/validation';
import { clearProject, createEmptyProject, getBrowserStorage, readProject, writeProject } from './storage';
import type { StorageLike } from './storage';

/** A room before the store gives it an id and timestamps. */
export type RoomInput = Omit<Room, 'id' | 'createdAt' | 'updatedAt'>;

export type StoreNotice = Extract<ErrorCode, 'STO_001' | 'STO_002'>;

export interface StoreOptions {
  /** Defaults to the browser's localStorage. Pass null for no storage. */
  storage?: StorageLike | null;
  now?: () => string;
  newId?: () => string;
  debounceMs?: number;
}

export interface ProjectStore {
  /** A copy of the project. Changing it does not change the store. */
  getState(): Project;
  /** STO_001 (cannot save) or STO_002 (saved data was reset), until dismissed. */
  getNotice(): StoreNotice | null;
  dismissNotice(): void;
  addRoom(input: RoomInput): Room;
  updateRoom(id: string, patch: Partial<RoomInput>): Room;
  removeRoom(id: string): boolean;
  setSettings(patch: Partial<Settings>): Settings;
  /** Called after every change. Returns a function that stops the calls. */
  subscribe(listener: () => void): () => void;
  /** Save now instead of waiting for the pause. Call on pagehide. */
  flush(): void;
  /** Delete the saved project and start empty (PRD Rule 9). */
  clearMyData(): void;
}

/** A starting room for the "Add room" button, in the project's unit system. */
export function createDefaultRoomInput(settings: Settings, index: number): RoomInput {
  return {
    name: `Room ${index + 1}`,
    lengthM: 4,
    widthM: 3.5,
    heightM: DEFAULT_HEIGHT_M,
    openings: [],
    paint: defaultPaintOptions(settings.unitSystem),
    flooring: defaultFlooringOptions(settings.unitSystem),
    tile: defaultTileOptions(settings.unitSystem),
    wallpaper: defaultWallpaperOptions(settings.unitSystem),
  };
}

function randomId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createProjectStore(options: StoreOptions = {}): ProjectStore {
  const storage = options.storage === undefined ? getBrowserStorage() : options.storage;
  const now = options.now ?? ((): string => new Date().toISOString());
  const newId = options.newId ?? randomId;
  const debounceMs = options.debounceMs ?? 300;

  const loaded = readProject(storage, now());
  let state: Project = loaded.project;
  let notice: StoreNotice | null = loaded.notice;
  // When storage is unusable we keep working in memory and do not retry every change.
  const canPersist = loaded.status !== 'unavailable';
  let dirty = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  const notify = (): void => {
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch {
        // One broken listener must not stop the others or corrupt the store.
      }
    }
  };

  const stopTimer = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const flush = (): void => {
    stopTimer();
    if (!dirty || !canPersist) return;
    dirty = false;
    const result = writeProject(state, storage);
    if (!result.ok && notice !== result.notice) {
      notice = result.notice;
      notify();
    }
  };

  const commit = (candidate: Project): void => {
    const clean = sanitizeProject({ ...candidate, updatedAt: now() });
    if (clean === null) throw new CalcValidationError('CALC_007', 'project');
    state = clean;
    dirty = true;
    stopTimer();
    timer = setTimeout(flush, debounceMs);
    notify();
  };

  const findRoom = (id: string): Room => {
    const room = state.rooms.find((r) => r.id === id);
    if (!room) throw new RangeError('No room with that id');
    return room;
  };

  return {
    getState: () => structuredClone(state),
    getNotice: () => notice,
    dismissNotice() {
      if (notice === null) return;
      notice = null;
      notify();
    },

    addRoom(input) {
      if (state.rooms.length >= LIMITS.maxRooms) throw new CalcValidationError('CALC_003', 'rooms');
      const stamp = now();
      const room: Room = { ...input, id: newId(), createdAt: stamp, updatedAt: stamp };
      validateRoom(room);
      commit({ ...state, rooms: [...state.rooms, room] });
      return structuredClone(findRoom(room.id));
    },

    updateRoom(id, patch) {
      const existing = findRoom(id);
      const room: Room = {
        ...existing,
        ...patch,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: now(),
      };
      validateRoom(room);
      commit({ ...state, rooms: state.rooms.map((r) => (r.id === id ? room : r)) });
      return structuredClone(findRoom(id));
    },

    removeRoom(id) {
      if (!state.rooms.some((r) => r.id === id)) return false;
      commit({ ...state, rooms: state.rooms.filter((r) => r.id !== id) });
      return true;
    },

    setSettings(patch) {
      const merged: Settings = { ...state.settings, ...patch };
      validateSettings(merged);
      commit({ ...state, settings: merged });
      return structuredClone(state.settings);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    flush,

    clearMyData() {
      stopTimer();
      dirty = false;
      clearProject(storage);
      state = createEmptyProject(now());
      notice = null;
      notify();
    },
  };
}

let shared: ProjectStore | null = null;

/** The store the page scripts share. Created on first use, in the browser. */
export function getProjectStore(): ProjectStore {
  shared ??= createProjectStore();
  return shared;
}

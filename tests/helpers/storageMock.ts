import type { StorageLike } from '../../src/lib/state/storage';

export interface MemoryStorage extends StorageLike {
  /** Direct view of what is stored, for assertions. */
  readonly data: Map<string, string>;
}

/** Working in-memory storage. Pass initial values to start with saved data. */
export function createMemoryStorage(initial: Record<string, string> = {}): MemoryStorage {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

/** Storage that throws on every call, like a blocked or private-mode browser. */
export function createFailingStorage(): StorageLike {
  const fail = (): never => {
    throw new Error('storage unavailable');
  };
  return { getItem: fail, setItem: fail, removeItem: fail };
}

/** Storage that reads and removes normally but throws when saving, like a full disk. */
export function createFullStorage(initial: Record<string, string> = {}): MemoryStorage {
  const memory = createMemoryStorage(initial);
  return {
    ...memory,
    setItem: () => {
      throw new Error('quota exceeded');
    },
  };
}

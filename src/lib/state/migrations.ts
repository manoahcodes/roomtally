/**
 * Schema migrations (Backend_Schema §5). Each entry upgrades stored data from
 * version N to N+1. Version 1 is the first schema, so the table is empty today.
 * A stored version newer than this code knows is never migrated down.
 */
import { SCHEMA_VERSION } from '../../types/project';

export type Migration = (data: Record<string, unknown>) => unknown;

/** Key is the version the migration starts from. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

/**
 * Bring stored data up to the target version. Returns null when the data cannot
 * be used: not an object, no integer version, a newer version, a gap in the
 * migration chain, or a migration that throws.
 */
export function migrate(
  data: unknown,
  table: Readonly<Record<number, Migration>> = MIGRATIONS,
  target: number = SCHEMA_VERSION,
): unknown {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
  let current: unknown = data;
  const start = (data as Record<string, unknown>).schemaVersion;
  if (typeof start !== 'number' || !Number.isInteger(start) || start < 1) return null;
  if (start > target) return null;
  let version: number = start;
  try {
    while (version < target) {
      const step = table[version];
      if (typeof step !== 'function') return null;
      current = step(current as Record<string, unknown>);
      if (typeof current !== 'object' || current === null || Array.isArray(current)) return null;
      const next = (current as Record<string, unknown>).schemaVersion;
      if (typeof next !== 'number' || next !== version + 1) return null;
      version = next;
    }
  } catch {
    return null;
  }
  return current;
}

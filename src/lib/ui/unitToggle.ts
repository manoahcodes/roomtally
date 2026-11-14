/**
 * Region and unit choice (PRD Rules 10 and 17).
 * Choosing a region or unit changes settings only. Rooms stay stored in metres and
 * litres, and the maths never changes: values are converted for display and back
 * for input. Imperial volume means US gallons, matching the paint can sizes in
 * src/data/materials.ts.
 */
import { REGIONS, isRegion } from '../../data/regions';
import type { Region, Settings, UnitSystem } from '../../types/project';
import { ftToM, litresToUsGal, m2ToSqFt, mToFt, roundTo, sqFtToM2, usGalToLitres } from '../calc/units';
import type { ProjectStore } from '../state/projectStore';
import { track } from './analytics';

/** Label used in the unit_changed event, for example "UK/metric". */
export function describeChoice(settings: Pick<Settings, 'region' | 'unitSystem'>): string {
  return `${settings.region}/${settings.unitSystem}`;
}

function change(store: ProjectStore, patch: Partial<Settings>): boolean {
  const before = store.getState().settings;
  const next = { ...before, ...patch };
  if (next.region === before.region && next.unitSystem === before.unitSystem) return false;
  store.setSettings(patch);
  track('unit_changed', { from: describeChoice(before), to: describeChoice(next) });
  return true;
}

/** Pick a region and switch to its default unit system. Returns false if nothing changed. */
export function applyRegion(store: ProjectStore, region: Region): boolean {
  if (!isRegion(region)) return false;
  return change(store, { region, unitSystem: REGIONS[region].unitSystem });
}

/** Switch metric or imperial and keep the region. Returns false if nothing changed. */
export function applyUnitSystem(store: ProjectStore, unitSystem: UnitSystem): boolean {
  if (unitSystem !== 'metric' && unitSystem !== 'imperial') return false;
  return change(store, { unitSystem });
}

const imperial = (unit: UnitSystem): boolean => unit === 'imperial';

/** Metres to the unit shown: metres or feet. */
export function lengthToDisplay(metres: number, unit: UnitSystem): number {
  return imperial(unit) ? mToFt(metres) : metres;
}
/** A typed length in the shown unit to metres. */
export function lengthFromDisplay(value: number, unit: UnitSystem): number {
  return imperial(unit) ? ftToM(value) : value;
}
export function areaToDisplay(m2: number, unit: UnitSystem): number {
  return imperial(unit) ? m2ToSqFt(m2) : m2;
}
export function areaFromDisplay(value: number, unit: UnitSystem): number {
  return imperial(unit) ? sqFtToM2(value) : value;
}
export function volumeToDisplay(litres: number, unit: UnitSystem): number {
  return imperial(unit) ? litresToUsGal(litres) : litres;
}
export function volumeFromDisplay(value: number, unit: UnitSystem): number {
  return imperial(unit) ? usGalToLitres(value) : value;
}

export function lengthLabel(unit: UnitSystem): string {
  return imperial(unit) ? 'ft' : 'm';
}
export function areaLabel(unit: UnitSystem): string {
  return imperial(unit) ? 'sq ft' : 'm²';
}
export function volumeLabel(unit: UnitSystem): string {
  return imperial(unit) ? 'US gal' : 'L';
}

/** A number for display: at most `decimals` places, no trailing zeros. */
export function formatNumber(value: number, decimals = 2): string {
  return String(roundTo(value, decimals));
}

export function formatLength(metres: number, unit: UnitSystem): string {
  return `${formatNumber(lengthToDisplay(metres, unit))} ${lengthLabel(unit)}`;
}
export function formatArea(m2: number, unit: UnitSystem): string {
  return `${formatNumber(areaToDisplay(m2, unit))} ${areaLabel(unit)}`;
}
export function formatVolume(litres: number, unit: UnitSystem): string {
  return `${formatNumber(volumeToDisplay(litres, unit))} ${volumeLabel(unit)}`;
}

import type { Region, UnitSystem } from '../types/project';

export interface RegionTerms {
  /** Word for the paint volume unit, for example "gallon" or "litre". */
  volume: string;
  /** Short area unit label, for example "sq ft" or "m²". */
  area: string;
  /** Short length unit label, for example "ft" or "m". */
  length: string;
}

export interface RegionPreset {
  code: Region;
  label: string;
  unitSystem: UnitSystem;
  /** ISO 4217 currency code. */
  currency: string;
  /** BCP 47 locale used for number and currency formatting. */
  locale: string;
  terms: RegionTerms;
}

export const REGIONS: Readonly<Record<Region, RegionPreset>> = {
  US: {
    code: 'US',
    label: 'United States',
    unitSystem: 'imperial',
    currency: 'USD',
    locale: 'en-US',
    terms: { volume: 'gallon', area: 'sq ft', length: 'ft' },
  },
  UK: {
    code: 'UK',
    label: 'United Kingdom',
    unitSystem: 'metric',
    currency: 'GBP',
    locale: 'en-GB',
    terms: { volume: 'litre', area: 'm²', length: 'm' },
  },
  CA: {
    code: 'CA',
    label: 'Canada',
    unitSystem: 'imperial',
    currency: 'CAD',
    locale: 'en-CA',
    terms: { volume: 'gallon', area: 'sq ft', length: 'ft' },
  },
  AU: {
    code: 'AU',
    label: 'Australia',
    unitSystem: 'metric',
    currency: 'AUD',
    locale: 'en-AU',
    terms: { volume: 'litre', area: 'm²', length: 'm' },
  },
};

export const REGION_CODES: readonly Region[] = ['US', 'UK', 'CA', 'AU'];

export function isRegion(value: unknown): value is Region {
  return typeof value === 'string' && (REGION_CODES as readonly string[]).includes(value);
}

/** Terms for a unit system inside a region: switching units changes wording too. */
export function termsFor(region: Region, unitSystem: UnitSystem): RegionTerms {
  const base = REGIONS[region].terms;
  if (unitSystem === REGIONS[region].unitSystem) return base;
  return unitSystem === 'imperial'
    ? { volume: 'gallon', area: 'sq ft', length: 'ft' }
    : { volume: 'litre', area: 'm²', length: 'm' };
}

/** Pick a region from a browser locale such as "en-GB". Falls back to US. */
export function regionFromLocale(locale: string | undefined): Region {
  const country = locale?.split('-')[1]?.toUpperCase();
  if (country === 'GB') return 'UK';
  if (country === 'CA' || country === 'AU' || country === 'US') return country;
  return 'US';
}

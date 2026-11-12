/**
 * Stored data model (Backend_Schema §2).
 * All lengths are metres, areas are m², volumes are litres.
 * Prices are plain numbers in the region currency, per canonical unit
 * (per litre, per m², or per roll).
 */

export const SCHEMA_VERSION = 1;

export type Region = 'US' | 'UK' | 'CA' | 'AU';
export type UnitSystem = 'metric' | 'imperial';
export type OpeningKind = 'door' | 'window';
export type LayPattern = 'straight' | 'diagonal' | 'herringbone';
export type TileSurface = 'floor' | 'wall';
export type MaterialId = 'paint' | 'flooring' | 'tile' | 'wallpaper';
export type PriceKey = 'paint' | 'ceilingPaint' | 'primer' | 'flooring' | 'tile' | 'wallpaper';

export interface Opening {
  id: string;
  kind: OpeningKind;
  widthM: number;
  heightM: number;
  count: number;
}

export interface PaintOptions {
  /** Whole number of coats, 1 to 4. */
  coats: number;
  /** Coverage per coat, m² per litre. */
  coverageM2PerL: number;
  /** Spare paint added on top of the need, percent 0 to 30. */
  wasteSparePct: number;
  /** Pack sizes in litres, any order. */
  packSizesL: number[];
}

export interface FlooringOptions {
  layPattern: LayPattern;
  /** Waste percent 0 to 30. */
  wastePct: number;
  /** Area one box covers, m². */
  boxCoverageM2: number;
}

export interface TileOptions {
  surface: TileSurface;
  tileWidthM: number;
  tileHeightM: number;
  /** Grout gap in metres, 0 to 0.02. */
  groutM: number;
  layPattern: LayPattern;
  /** Waste percent 0 to 30. */
  wastePct: number;
  /** Area one box covers, m². */
  boxCoverageM2: number;
}

export interface WallpaperOptions {
  rollWidthM: number;
  rollLengthM: number;
  /** Pattern repeat in metres, 0 (plain) to 0.9. */
  repeatM: number;
  /** Spare added on top of the need, percent 0 to 30. */
  wasteSparePct: number;
}

export interface Room {
  id: string;
  /** 1 to 40 characters. Shown as text only. */
  name: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  openings: Opening[];
  paint: PaintOptions;
  flooring: FlooringOptions;
  tile: TileOptions;
  wallpaper: WallpaperOptions;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  region: Region;
  unitSystem: UnitSystem;
  includeCeiling: boolean;
  includePrimer: boolean;
  /** Materials that appear in the shopping list. */
  enabledMaterials: MaterialId[];
  /** Price per canonical unit, 0 to 100,000. Missing key means no price. */
  prices: Partial<Record<PriceKey, number>>;
  /** Preset id to overridden value. */
  overrides: Record<string, number>;
}

export interface Project {
  schemaVersion: number;
  rooms: Room[];
  settings: Settings;
  createdAt: string;
  updatedAt: string;
}

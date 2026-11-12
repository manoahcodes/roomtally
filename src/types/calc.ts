import type { Region, UnitSystem } from './project';

/** Base unit a material is measured in before it is split into packs. */
export type BaseUnit = 'L' | 'm2' | 'roll';

/** Keys of the lines in a shopping list. */
export type MaterialKey = 'paint' | 'ceilingPaint' | 'primer' | 'flooring' | 'tile' | 'wallpaper';

export interface PackLine {
  /** Size of one pack in the base unit. */
  packSize: number;
  /** Whole number of packs of this size. */
  count: number;
}

export interface PackResult {
  /** Packs to buy, largest first. */
  packs: PackLine[];
  /** Total whole packs. */
  totalPacks: number;
  /** Total quantity the packs hold, in the base unit. Never below exactNeed. */
  totalQuantity: number;
  /** The unrounded need, in the base unit. */
  exactNeed: number;
}

export interface CostEstimate {
  amount: number;
  currency: string;
  /** Amount formatted for the region locale. */
  formatted: string;
  label: 'estimate';
}

export interface MaterialResult {
  key: MaterialKey;
  /** Human label, for example "Wall paint". */
  label: string;
  unit: BaseUnit;
  /** Whole packs to buy. Shown first. */
  buyQuantity: number;
  /** The unrounded need in `unit`. Shown beside the buy quantity. */
  exactQuantity: number;
  /** Quantity those packs hold, in `unit`. */
  coveredQuantity: number;
  packBreakdown: PackLine[];
  /** Tiles needed, for tile results. */
  tilesNeeded?: number;
  /** Cost estimate, only when a price was supplied. */
  cost?: CostEstimate | null;
}

/** The unrounded need for one material in one room. Summed across rooms before rounding. */
export interface MaterialNeed {
  key: MaterialKey;
  label: string;
  unit: BaseUnit;
  /** Unrounded need in `unit`, waste and spare already included. */
  exactQuantity: number;
  /** Pack sizes in `unit`. */
  packSizes: number[];
  /** Unrounded tile count. Rounded up once, after summing rooms. */
  tilesNeeded?: number;
}

export interface PaintResult {
  wall: MaterialResult;
  ceiling?: MaterialResult;
  primer?: MaterialResult;
}

export interface PaintNeeds {
  wall: MaterialNeed;
  ceiling?: MaterialNeed;
  primer?: MaterialNeed;
}

export interface PaintCalcOptions {
  includeCeiling: boolean;
  includePrimer: boolean;
}

/** One line of the Assumptions panel. */
export interface AssumptionLine {
  id: string;
  label: string;
  value: string;
  overridden: boolean;
}

export interface ShoppingList {
  region: Region;
  unitSystem: UnitSystem;
  roomCount: number;
  items: MaterialResult[];
  assumptions: AssumptionLine[];
  /** Sum of item costs, only when every shown item has a price. */
  totalCost: CostEstimate | null;
}

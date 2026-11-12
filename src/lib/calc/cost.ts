import { REGIONS } from '../../data/regions';
import type { CostEstimate, MaterialResult } from '../../types/calc';
import type { Region } from '../../types/project';

const CURRENCY_DECIMALS = 2;

function round2(amount: number): number {
  const factor = 10 ** CURRENCY_DECIMALS;
  return Math.round(amount * factor) / factor;
}

/** Format an amount in the region currency and locale, for example "£12.50". */
export function formatMoney(amount: number, region: Region): string {
  const { currency, locale } = REGIONS[region];
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

/**
 * Cost of what you actually buy: the quantity the packs hold times the price per
 * unit (per litre, per m² or per roll). Returns null when no price was given.
 * The result is always labelled "estimate" (PRD Rule 6).
 */
export function estimateCost(
  coveredQuantity: number,
  unitPrice: number | undefined,
  region: Region,
): CostEstimate | null {
  if (unitPrice === undefined) return null;
  const amount = round2(coveredQuantity * unitPrice);
  return {
    amount,
    currency: REGIONS[region].currency,
    formatted: formatMoney(amount, region),
    label: 'estimate',
  };
}

/** Sum of item costs. Null unless there is at least one item and every item has a price. */
export function totalCost(items: readonly MaterialResult[], region: Region): CostEstimate | null {
  if (items.length === 0) return null;
  let sum = 0;
  for (const item of items) {
    if (!item.cost) return null;
    sum += item.cost.amount;
  }
  const amount = round2(sum);
  return {
    amount,
    currency: REGIONS[region].currency,
    formatted: formatMoney(amount, region),
    label: 'estimate',
  };
}

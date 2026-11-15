/**
 * Shared steps for the Playwright specs. Selectors use the data- hooks documented in the
 * components, so a copy change never breaks a test. Metric units are the default.
 */
import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export const STORAGE_KEY = 'beautally:project:v1';

/** Turn window.print into a recorder, so a spec can look at the page while "printing". */
export async function stubPrint(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const record = window as unknown as { __printCalls: number; __printHeader: string | null };
    record.__printCalls = 0;
    record.__printHeader = null;
    window.print = () => {
      record.__printCalls += 1;
      record.__printHeader = document.querySelector('[data-print-header]')?.textContent ?? null;
    };
  });
}

/** Choose "Reject all" if the banner shows up. Rejecting keeps ads and analytics off. */
export async function dismissConsent(page: Page): Promise<void> {
  const reject = page.getByRole('button', { name: 'Reject all' }).first();
  try {
    await reject.click({ timeout: 4000 });
  } catch {
    // No banner on this page load (a choice was already saved).
  }
}

/** Type the three core sizes, in the form's current units. */
export async function fillRoom(
  page: Page,
  size: { length: string; width: string; height: string; name?: string },
): Promise<void> {
  if (size.name !== undefined) await page.locator('#room-name').fill(size.name);
  await page.locator('#room-length').fill(size.length);
  await page.locator('#room-width').fill(size.width);
  await page.locator('#room-height').fill(size.height);
}

export const card = (page: Page, material: string): Locator =>
  page.locator(`[data-material-card="${material}"]`);

/** The big "buy" number on a card. */
export const buy = (page: Page, material: string): Locator =>
  card(page, material).locator('[data-buy-value]');

export const exact = (page: Page, material: string): Locator =>
  card(page, material).locator('[data-exact]');

export async function expectBuy(page: Page, expected: Record<string, string>): Promise<void> {
  for (const [material, count] of Object.entries(expected)) {
    await expect(buy(page, material)).toHaveText(count);
  }
}

/** Raw saved project, or null. */
export async function savedProject(page: Page): Promise<string | null> {
  return page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
}

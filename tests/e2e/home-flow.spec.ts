/**
 * Journey 1 (App_Flow §B.7): first visit to shopping list, end to end.
 * Expected numbers come from the unit tests for a 4 m x 3.5 m x 2.4 m room with no doors or
 * windows: paint 7.56 L -> 4 cans, flooring 15.4 m2 -> 8 boxes, tile 15.1 m2 -> 16 boxes,
 * wallpaper 7.975 rolls -> 8 rolls. A second 3 m x 3 m room gives 5, 13, 25 and 15, because
 * rooms are added first and rounded up once.
 */
import { expect, test } from '@playwright/test';
import {
  buy,
  card,
  dismissConsent,
  exact,
  expectBuy,
  fillRoom,
  savedProject,
  stubPrint,
} from './helpers';

test.describe('home page: enter a room, get one list', () => {
  test.beforeEach(async ({ page }) => {
    await stubPrint(page);
    await page.goto('/');
    await dismissConsent(page);
  });

  test('starts with the hero and an empty list', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Enter your room once and get everything you need to buy.',
    );
    await expect(page.locator('[data-results-empty]')).toBeVisible();
    await expect(page.locator('[data-material-card]')).toHaveCount(0);
  });

  test('shows all four materials, buy quantity first, then the exact need', async ({ page }) => {
    await fillRoom(page, { length: '4', width: '3.5', height: '2.4' });

    await expectBuy(page, { paint: '4', flooring: '8', tile: '16', wallpaper: '8' });
    await expect(page.locator('[data-material-card]')).toHaveCount(4);
    await expect(exact(page, 'paint')).toHaveText('7.56 L');
    await expect(exact(page, 'flooring')).toHaveText('15.4 m²');

    // The buy number is drawn before the exact need inside the card.
    const text = await card(page, 'paint').innerText();
    expect(text.indexOf('Exact need')).toBeGreaterThan(text.indexOf('cans'));
  });

  test('doors and windows come off the walls', async ({ page }) => {
    await fillRoom(page, { length: '4', width: '3.5', height: '2.4' });
    await expect(buy(page, 'paint')).toHaveText('4');

    // New rows start as a 0.9 m x 2 m door. Make the second one a 1.2 m x 1.2 m window.
    await page.locator('[data-add-opening]').click();
    await page.locator('[data-add-opening]').click();
    const window = page.locator('[data-opening-row]').nth(1);
    await window.locator('[data-opening-field="kind"]').selectOption('window');
    await window.locator('[data-opening-field="width"]').fill('1.2');
    await window.locator('[data-opening-field="height"]').fill('1.2');

    // Paint falls from 7.56 L to 6.88 L, which needs one can fewer.
    await expect(buy(page, 'paint')).toHaveText('3');
    await expect(exact(page, 'paint')).toHaveText('6.88 L');
    await expect(buy(page, 'flooring')).toHaveText('8');
  });

  test('changing a default updates the list and the Assumptions panel', async ({ page }) => {
    await fillRoom(page, { length: '4', width: '3.5', height: '2.4' });
    await page.locator('details', { hasText: 'Paint options' }).locator('summary').click();
    await page.locator('[data-option="paint.coats"]').selectOption('3');

    await expect(exact(page, 'paint')).toHaveText('11.34 L');
    await page.locator('[data-assumptions]').locator('summary').click();
    await expect(page.locator('[data-assumptions-live]')).toContainText('Paint coats');
    await expect(page.locator('[data-assumptions-live]')).toContainText('3');
  });

  test('shows a field message with its code and no result for a bad size', async ({ page }) => {
    await fillRoom(page, { length: '0.1', width: '3.5', height: '2.4' });
    await page.locator('#room-width').focus(); // leaving the length field reveals its message

    await expect(page.locator('#room-length-error')).toBeVisible();
    await expect(page.locator('#room-length-error')).toContainText('CALC_001');
    await expect(page.locator('#room-length')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('[data-material-card]')).toHaveCount(0);

    await page.locator('#room-length').fill('4');
    await expect(page.locator('#room-length-error')).toBeHidden();
    await expectBuy(page, { paint: '4', flooring: '8' });
  });

  test('shows CALC_007 when a size is not a number', async ({ page }) => {
    await fillRoom(page, { length: 'abc', width: '3.5', height: '2.4' });
    await page.getByRole('button', { name: 'Calculate my list' }).click();

    await expect(page.locator('#room-length-error')).toContainText('CALC_007');
    await expect(page.locator('[data-results-invalid]')).toBeVisible();
    await expect(page.locator('[data-material-card]')).toHaveCount(0);
  });

  test('shows CALC_002 when doors and windows are bigger than the walls', async ({ page }) => {
    await fillRoom(page, { length: '4', width: '3.5', height: '2.4' });
    await page.locator('[data-add-opening]').click();
    const row = page.locator('[data-opening-row]').first();
    await row.locator('[data-opening-field="width"]').fill('5');
    await row.locator('[data-opening-field="height"]').fill('3');
    await row.locator('[data-opening-field="count"]').fill('10');
    await page.getByRole('button', { name: 'Calculate my list' }).click();

    await expect(page.locator('#openings-error')).toContainText('CALC_002');
    await expect(page.locator('[data-material-card]')).toHaveCount(0);
  });

  test('adds a second room and rounds up once for the total', async ({ page }) => {
    await fillRoom(page, { length: '4', width: '3.5', height: '2.4', name: 'Bedroom' });
    await expectBuy(page, { paint: '4', flooring: '8', tile: '16', wallpaper: '8' });

    await page.getByRole('button', { name: 'Add another room' }).click();
    await expect(page.locator('#room-length')).toHaveValue('');
    await fillRoom(page, { length: '3', width: '3', height: '2.4', name: 'Study' });

    await expect(page.locator('[data-room-count]')).toHaveText('2');
    await expect(page.locator('[data-room-item]')).toHaveCount(2);
    await expect(page.locator('[data-room-name]').first()).toHaveText('Bedroom');
    await expectBuy(page, { paint: '5', flooring: '13', tile: '25', wallpaper: '15' });
    await expect(page.locator('[data-result-room-count]')).toHaveText('2');
  });

  test('keeps rooms after a reload and removes one on request', async ({ page }) => {
    await fillRoom(page, { length: '4', width: '3.5', height: '2.4' });
    await page.getByRole('button', { name: 'Add another room' }).click();
    await fillRoom(page, { length: '3', width: '3', height: '2.4' });
    await expectBuy(page, { paint: '5' });

    await page.reload();
    await expect(page.locator('[data-room-item]')).toHaveCount(2);
    await expectBuy(page, { paint: '5', flooring: '13', tile: '25', wallpaper: '15' });

    await page.locator('[data-room-item]').nth(1).getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('[data-room-item]')).toHaveCount(1);
    await expectBuy(page, { paint: '4', flooring: '8' });
  });

  test('prints the list with a title and date, then removes them', async ({ page }) => {
    await fillRoom(page, { length: '4', width: '3.5', height: '2.4' });
    await expectBuy(page, { paint: '4' });

    await page.getByRole('button', { name: 'Print my list' }).click();
    const printed = await page.evaluate(() => {
      const record = window as unknown as { __printCalls: number; __printHeader: string | null };
      return { calls: record.__printCalls, header: record.__printHeader };
    });
    expect(printed.calls).toBe(1);
    expect(printed.header).toContain('Beautally shopping list');

    // The browser reports the end of printing; the added header goes away.
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await expect(page.locator('[data-print-header]')).toHaveCount(0);
  });

  test('Clear my data deletes the saved rooms', async ({ page }) => {
    await fillRoom(page, { length: '4', width: '3.5', height: '2.4' });
    await expectBuy(page, { paint: '4' });
    await expect.poll(() => savedProject(page)).not.toBeNull();

    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Clear my data' }).click();

    await expect(page.locator('[data-room-count]')).toHaveText('0');
    await expect(page.locator('[data-results-empty]')).toBeVisible();
    await expect(page.locator('#room-length')).toHaveValue('');
    await expect.poll(() => savedProject(page)).toBeNull();
  });
});

test.describe('storage problems', () => {
  test('STO_001: works from memory and says so when the browser blocks storage', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError');
        },
      });
    });
    await page.goto('/');
    await dismissConsent(page);

    await expect(page.locator('[data-store-notice]')).toContainText(
      "We can't save in this browser, so your rooms will be lost when you leave.",
    );
    // Nothing could be loaded, so the visitor starts in the US and sizes are in feet.
    await fillRoom(page, { length: '13', width: '11.5', height: '8' });
    await expect(page.locator('[data-material-card]')).toHaveCount(4);
  });

  test('STO_002: resets damaged saved data with a friendly note', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('beautally:project:v1', '{"schemaVersion":1,"rooms":"nope"}');
    });
    await page.goto('/');
    await dismissConsent(page);

    await expect(page.locator('[data-store-notice]')).toContainText(
      'We reset your saved rooms because they could not be read.',
    );
    // The reset project starts in the US, so sizes are in feet.
    await fillRoom(page, { length: '13', width: '11.5', height: '8' });
    await expect(page.locator('[data-material-card]')).toHaveCount(4);
  });
});

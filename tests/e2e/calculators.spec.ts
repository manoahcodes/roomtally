/**
 * Calculator pages (App_Flow §A.1, Journey 2): one known room per calculator, with the
 * result the unit tests give for it. Room: 4 m x 3.5 m x 2.4 m, no doors or windows.
 *
 *   paint      7.56 L     -> 4 cans
 *   flooring   15.4 m2    -> 8 boxes of 2 m2
 *   tile       15.1 m2    -> 16 boxes of 1 m2, about 168 tiles
 *   wallpaper  7.98 rolls -> 8 rolls
 *
 * The room-type pages start from a typical room with one door and the room's windows.
 * Their expected litres and cans are the unit-test results for those presets.
 */
import { expect, test } from '@playwright/test';
import { buy, card, dismissConsent, exact, expectBuy, fillRoom, savedProject } from './helpers';

const calculators = [
  { path: '/paint-calculator/', material: 'paint', buy: '4', exact: '7.56 L' },
  { path: '/flooring-calculator/', material: 'flooring', buy: '8', exact: '15.4 m²' },
  { path: '/tile-calculator/', material: 'tile', buy: '16', exact: '15.1 m²' },
  { path: '/wallpaper-calculator/', material: 'wallpaper', buy: '8', exact: undefined },
] as const;

for (const calculator of calculators) {
  test.describe(`${calculator.material} calculator`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(calculator.path);
      await dismissConsent(page);
    });

    test('has one h1 and starts with an empty list', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.locator('[data-results-empty]')).toBeVisible();
      await expect(page.locator('[data-material-card]')).toHaveCount(0);
    });

    test('gives the expected result for the known room, and only its own material', async ({
      page,
    }) => {
      await fillRoom(page, { length: '4', width: '3.5', height: '2.4' });

      await expect(buy(page, calculator.material)).toHaveText(calculator.buy);
      if (calculator.exact)
        await expect(exact(page, calculator.material)).toHaveText(calculator.exact);
      await expect(page.locator('[data-material-card]')).toHaveCount(1);
      await expect(card(page, calculator.material)).toBeVisible();
    });

    test('shows no result for an invalid size', async ({ page }) => {
      await fillRoom(page, { length: '0', width: '3.5', height: '2.4' });
      await expect(page.locator('#room-length-error')).toContainText('CALC_001');
      await expect(page.locator('[data-material-card]')).toHaveCount(0);
    });

    test('leaves the saved project alone', async ({ page }) => {
      const before = await savedProject(page);
      await fillRoom(page, { length: '4', width: '3.5', height: '2.4' });
      await expect(buy(page, calculator.material)).toHaveText(calculator.buy);

      await page.goto('/');
      await expect(page.locator('[data-room-count]')).toHaveText('0');
      await expect(page.locator('[data-material-card]')).toHaveCount(0);
      expect(await savedProject(page)).toBe(before);
    });
  });
}

test.describe('tile calculator details', () => {
  test('lists the tile count next to the boxes', async ({ page }) => {
    await page.goto('/tile-calculator/');
    await dismissConsent(page);
    await fillRoom(page, { length: '4', width: '3.5', height: '2.4' });

    await expect(card(page, 'tile').locator('[data-tiles]')).toHaveText('About 168 tiles');
  });

  test('the wall surface uses the wall area instead of the floor', async ({ page }) => {
    await page.goto('/tile-calculator/');
    await dismissConsent(page);
    await fillRoom(page, { length: '4', width: '3.5', height: '2.4' });
    await page.locator('[data-option="tile.surface"]').selectOption('wall');

    // Walls are 36 m2: 36 / 0.091809 x 1.10 = 431.3 tiles, rounded up to 432, or 38.8 m2 in 39 boxes.
    await expect(buy(page, 'tile')).toHaveText('39');
    await expect(card(page, 'tile').locator('[data-card-title]')).toHaveText('Wall tile');
  });
});

const rooms = [
  { slug: 'bedroom', size: ['4', '3.5', '2.4'], exact: '6.88 L', cans: '3' },
  { slug: 'living-room', size: ['5', '4', '2.4'], exact: '8.09 L', cans: '3' },
  { slug: 'kitchen', size: ['4', '3', '2.4'], exact: '6.38 L', cans: '5' },
  { slug: 'bathroom', size: ['2.5', '2', '2.4'], exact: '3.86 L', cans: '4' },
] as const;

test.describe('room-type paint pages start with a typical room', () => {
  for (const room of rooms) {
    test(`/paint-calculator/${room.slug}/ shows its answer without typing`, async ({ page }) => {
      await page.goto(`/paint-calculator/${room.slug}/`);
      await dismissConsent(page);

      await expect(page.locator('#room-length')).toHaveValue(room.size[0]);
      await expect(page.locator('#room-width')).toHaveValue(room.size[1]);
      await expect(page.locator('#room-height')).toHaveValue(room.size[2]);
      await expect(exact(page, 'paint')).toHaveText(room.exact);
      await expect(buy(page, 'paint')).toHaveText(room.cans);
      await expect(page.getByRole('heading', { level: 1 })).toContainText('paint calculator');
    });
  }

  test('editing the sizes updates the paint estimate', async ({ page }) => {
    await page.goto('/paint-calculator/bedroom/');
    await dismissConsent(page);
    await expect(exact(page, 'paint')).toHaveText('6.88 L');

    await page.locator('#room-length').fill('5');
    await expect(exact(page, 'paint')).not.toHaveText('6.88 L');
    await expect(card(page, 'paint')).toBeVisible();
  });

  test('"Add to my project" saves the room and opens the home page with it', async ({ page }) => {
    await page.goto('/paint-calculator/bedroom/');
    await dismissConsent(page);
    await expect(buy(page, 'paint')).toHaveText('3');

    await page.getByRole('link', { name: 'Add to my project' }).click();
    await page.waitForURL((url) => url.pathname === '/');

    await expect(page.locator('[data-room-count]')).toHaveText('1');
    await expectBuy(page, { paint: '3', flooring: '8', tile: '16', wallpaper: '8' });
  });
});

/**
 * Consent (PRD Rules 13-14, NV2; App_Flow Journey 3): nothing from an ad or analytics host
 * is requested before the visitor chooses, "Reject all" keeps it that way, "Accept all"
 * starts ads only when the build has them switched on, and the footer reopens the choices.
 *
 * Ads exist in a build only with PUBLIC_ADS_ENABLED=true and a real PUBLIC_ADSENSE_CLIENT
 * (ca-pub-...). Run the build with both set to also cover the "script loads" branch; with
 * the defaults the same test checks that accepting still loads nothing.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const ADS_BUILT =
  env.PUBLIC_ADS_ENABLED === 'true' && /^ca-pub-\d{10,20}$/.test(env.PUBLIC_ADSENSE_CLIENT ?? '');

const THIRD_PARTY =
  /(googlesyndication|googleadservices|doubleclick|googletagmanager|google-analytics|cloudflareinsights)\./;

/** Record every request to an ad or analytics host and answer it with an empty script. */
async function watchThirdParties(page: Page): Promise<string[]> {
  const seen: string[] = [];
  await page.route(THIRD_PARTY, (route) => {
    seen.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  return seen;
}

const banner = (page: Page) => page.getByRole('button', { name: 'Accept all' }).first();

async function consentCookie(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();
  return cookies.find((cookie) => cookie.name === 'roomtally_consent')?.value ?? null;
}

test.describe('before any choice', () => {
  test('asks first and loads nothing from ad or analytics hosts', async ({ page }) => {
    const seen = await watchThirdParties(page);
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(seen).toEqual([]);
    await expect(page.locator('script[data-roomtally-ads]')).toHaveCount(0);
    await expect(page.locator('script[data-roomtally-beacon]')).toHaveCount(0);
    await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
  });

  test('Consent Mode defaults are all denied', async ({ page }) => {
    await page.goto('/');
    await expect(banner(page)).toBeVisible();

    const defaults = await page.evaluate(() => {
      const layer = (window as unknown as { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? [];
      const entry = Array.from(layer).find((item) => item[0] === 'consent' && item[1] === 'default');
      return entry ? (entry[2] as Record<string, string>) : null;
    });
    expect(defaults).not.toBeNull();
    expect(defaults).toMatchObject({
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });
});

test.describe('Reject all', () => {
  test('keeps ads and analytics off, hides the banner and remembers the choice', async ({ page }) => {
    const seen = await watchThirdParties(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Reject all' }).first().click();

    await expect(banner(page)).toBeHidden();
    await expect.poll(() => consentCookie(page)).not.toBeNull();
    await page.waitForLoadState('networkidle');
    expect(seen).toEqual([]);
    await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(banner(page)).toBeHidden();
    expect(seen).toEqual([]);
  });

  test('the page works the same after rejecting', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reject all' }).first().click();
    await page.locator('#room-length').fill('4');
    await page.locator('#room-width').fill('3.5');
    await page.locator('#room-height').fill('2.4');
    await expect(page.locator('[data-material-card="paint"] [data-buy-value]')).toHaveText('4');
  });
});

test.describe('Accept all', () => {
  test(
    ADS_BUILT
      ? 'loads the ad script only now'
      : 'saves the choice; this build has ads off, so still nothing loads',
    async ({ page }) => {
      const seen = await watchThirdParties(page);
      await page.goto('/');
      expect(seen).toEqual([]);

      await banner(page).click();
      await expect.poll(() => consentCookie(page)).toContain('advertisement');

      if (ADS_BUILT) {
        await expect(page.locator('script[data-roomtally-ads]')).toHaveCount(1);
        await expect.poll(() => seen.some((url) => url.includes('adsbygoogle.js'))).toBe(true);
      } else {
        await page.waitForLoadState('networkidle');
        expect(seen).toEqual([]);
        await expect(page.locator('script[data-roomtally-ads]')).toHaveCount(0);
      }
    },
  );

  test('never puts ads on a legal page, and at most 3 on any other page', async ({ page }) => {
    await watchThirdParties(page);
    await page.goto('/');
    await banner(page).click();
    await expect.poll(() => consentCookie(page)).not.toBeNull();

    expect(await page.locator('[data-ad-slot]').count()).toBeLessThanOrEqual(3);
    for (const path of ['/privacy/', '/cookies/', '/terms/', '/disclaimer/', '/about/']) {
      await page.goto(path);
      await expect(page.locator('body')).toHaveAttribute('data-no-ads', '');
      await expect(page.locator('[data-ad-slot]')).toHaveCount(0);
      await expect(page.locator('ins.adsbygoogle')).toHaveCount(0);
    }
  });
});

test.describe('changing the choice later', () => {
  test('the footer button reopens the preferences on every page', async ({ page }) => {
    for (const path of ['/', '/paint-calculator/', '/guides/', '/privacy/']) {
      await page.goto(path);
      await page.getByRole('button', { name: 'Reject all' }).first().click();
      await page.getByRole('button', { name: 'Cookie preferences' }).click();
      await expect(page.locator('html')).toHaveClass(/show--preferences/);
      await expect(page.getByText('Necessary', { exact: true }).first()).toBeVisible();
      await page.context().clearCookies();
    }
  });

  test('a rejected visitor can accept later from the preference centre', async ({ page }) => {
    await watchThirdParties(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Reject all' }).first().click();
    await expect.poll(() => consentCookie(page)).not.toContain('advertisement');

    await page.getByRole('button', { name: 'Cookie preferences' }).click();
    await page.getByRole('button', { name: 'Accept all' }).last().click();
    await expect.poll(() => consentCookie(page)).toContain('advertisement');
  });
});

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';

/**
 * Every test starts as a visitor in the UK, so sizes are in metres and litres. A first visit
 * defaults to the US (feet and gallons), and the specs type metres. The project is saved the
 * same way the app saves it, so it goes through the normal validation when the page loads.
 */
const NOW = '2026-01-01T00:00:00.000Z';
const METRIC_PROJECT = JSON.stringify({
  schemaVersion: 1,
  rooms: [],
  settings: {
    region: 'UK',
    unitSystem: 'metric',
    includeCeiling: false,
    includePrimer: false,
    enabledMaterials: ['paint', 'flooring', 'tile', 'wallpaper'],
    prices: {},
    overrides: {},
  },
  createdAt: NOW,
  updatedAt: NOW,
});

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE_URL,
          localStorage: [{ name: 'beautally:project:v1', value: METRIC_PROJECT }],
        },
      ],
    },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
});

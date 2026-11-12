import { defineConfig } from 'vitest/config';

// Node is the default environment. The jsdom suites (renderResults, ads-consent)
// opt in with a `// @vitest-environment jsdom` comment on their first line.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      thresholds: {
        lines: 80,
        'src/lib/calc/**': { lines: 95 },
        'src/lib/state/**': { lines: 90 },
      },
    },
  },
});

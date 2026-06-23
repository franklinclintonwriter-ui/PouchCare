import { defineConfig, devices } from '@playwright/test';

const e2eWebServers = process.env.E2E_NO_SERVER
  ? undefined
  : [
      {
        command: 'npm run dev --workspace=api',
        url: 'http://127.0.0.1:7000/v1/health',
        reuseExistingServer: true,
        timeout: 120_000,
      },
      {
        command: 'npm run dev --workspace=m.pouchcare.com',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
    ];

/**
 * E2E tests hit the Vite dev server (port 3000 in apps/management) and expect the API
 * reachable via the Vite proxy (apps/api, default PORT from apps/api/.env e.g. 7000).
 * Start both before running: `npm run dev:api` and `npm run dev:mgmt` (or rely on webServer below).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: e2eWebServers,
});

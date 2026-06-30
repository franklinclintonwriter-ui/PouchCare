import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function apiDevOrigin(): string {
  const explicit = process.env.POUCHCARE_API_DEV_ORIGIN?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const envPath = path.resolve(__dirname, 'apps/api/.env');
  let port = 7000;
  try {
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const m = trimmed.match(/^PORT\s*=\s*(\d+)/);
        if (!m) continue;
        const parsed = Number.parseInt(m[1], 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
          port = parsed;
        }
        break;
      }
    }
  } catch {
    // keep default
  }
  return `http://127.0.0.1:${port}`;
}

const apiOrigin = apiDevOrigin();

const e2eWebServers = process.env.E2E_NO_SERVER
  ? undefined
  : [
      {
        command: 'npm run dev --workspace=api',
        url: `${apiOrigin}/health/ready`,
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

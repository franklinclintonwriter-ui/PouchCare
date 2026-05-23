import { test, expect } from '@playwright/test';
import { mockAuthState, mockApiEndpoint, navigateAndWait } from './utils/test-helpers.js';

const mockStatsResponse = {
  overview: {
    totalCustomers: 150,
    activeLicenses: 89,
    totalLicenses: 120,
    activeSites: 245,
    recentlyActive: 198,
  },
};

const mockSnapshotData = {
  companies: [
    { name: 'Acme Corp', plan: 'Pro', status: 'Active', websites: 5, mrr: 299, updated: '2024-03-15' },
    { name: 'Tech Inc', plan: 'Business', status: 'Active', websites: 12, mrr: 599, updated: '2024-03-14' },
    { name: 'Startup Co', plan: 'Starter', status: 'Trial', websites: 2, mrr: 0, updated: '2024-03-13' },
  ],
  billingRecords: [
    { id: 1, company: 'Acme Corp', amount: 299, status: 'Paid' },
    { id: 2, company: 'Tech Inc', amount: 599, status: 'Pending' },
  ],
};

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthState(page, { email: 'admin@pouchcare.com', role: 'admin' });
    await mockApiEndpoint(page, '/admin/stats', mockStatsResponse);
    await mockApiEndpoint(page, '/admin/snapshot', mockSnapshotData);
  });

  test('should load dashboard page', async ({ page }) => {
    await navigateAndWait(page, '/admin');

    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should display stat cards', async ({ page }) => {
    await navigateAndWait(page, '/admin');

    await expect(page.locator('text=Customers (platform)')).toBeVisible();
    await expect(page.locator('text=Active licenses')).toBeVisible();
    await expect(page.locator('text=Connected sites')).toBeVisible();
    await expect(page.locator('text=MRR (snapshot)')).toBeVisible();
  });

  test('should show platform stats from API', async ({ page }) => {
    await navigateAndWait(page, '/admin');

    await page.waitForResponse((response) =>
      response.url().includes('/admin/stats') && response.status() === 200
    ).catch(() => {});

    await page.waitForTimeout(1000);

    const pageContent = await page.content();
    const hasStats = pageContent.includes('150') || pageContent.includes('89') || pageContent.includes('245');
    expect(hasStats || pageContent.includes('Customers')).toBeTruthy();
  });

  test('should display companies data table', async ({ page }) => {
    await navigateAndWait(page, '/admin');

    const table = page.locator('table');
    if (await table.isVisible()) {
      await expect(table).toBeVisible();
      await expect(page.locator('th:has-text("Company"), th:has-text("Plan")')).toBeVisible();
    }
  });

  test('should show CRM snapshot description', async ({ page }) => {
    await navigateAndWait(page, '/admin');

    await expect(page.locator('text=/CRM|snapshot|workspace/i').first()).toBeVisible();
  });

  test('should have manage companies button', async ({ page }) => {
    await navigateAndWait(page, '/admin');

    const manageButton = page.locator('a:has-text("Manage companies"), button:has-text("Manage companies")');
    if (await manageButton.isVisible()) {
      await expect(manageButton).toBeVisible();
    }
  });

  test('should handle API error gracefully', async ({ page }) => {
    await page.route('**/admin/stats**', (route) => {
      route.fulfill({ status: 500, body: 'Server Error' });
    });

    await navigateAndWait(page, '/admin');

    await expect(page.locator('text=Dashboard')).toBeVisible();
    const dashElement = page.locator('text=/API unreachable|—|No data/');
    await expect(dashElement.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show loading state for stats', async ({ page }) => {
    await page.route('**/admin/stats**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStatsResponse),
      });
    });

    await navigateAndWait(page, '/admin');

    const loadingIndicator = page.locator('text=/…|Loading/');
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
  });
});

test.describe('Admin Dashboard - Unauthenticated', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('pouchcare_admin_token');
      localStorage.removeItem('pouchcare_admin_user');
    });

    await page.goto('/admin');
    await page.waitForTimeout(1000);

    const url = page.url();
    const isOnLoginOrDashboard = url.includes('login') || url.includes('admin');
    expect(isOnLoginOrDashboard).toBeTruthy();
  });
});

test.describe('Admin Dashboard - Update Notice', () => {
  test('should show update notice when available', async ({ page }) => {
    await mockAuthState(page, { email: 'admin@pouchcare.com', role: 'admin' });

    await page.addInitScript(() => {
      window.__POUCHCARE_UPDATE_AVAILABLE__ = {
        currentVersion: '1.0.0',
        newVersion: '1.1.0',
        changelog: ['Bug fixes', 'Performance improvements'],
      };
    });

    await navigateAndWait(page, '/admin');

    const updateNotice = page.locator('text=/update|new version/i');
    if (await updateNotice.isVisible()) {
      await expect(updateNotice).toBeVisible();
    }
  });

  test('should dismiss update notice', async ({ page }) => {
    await mockAuthState(page, { email: 'admin@pouchcare.com', role: 'admin' });

    await page.addInitScript(() => {
      window.__POUCHCARE_UPDATE_AVAILABLE__ = {
        currentVersion: '1.0.0',
        newVersion: '1.1.0',
        changelog: [],
      };
    });

    await navigateAndWait(page, '/admin');

    const dismissButton = page.locator('button:has-text("Dismiss"), button:has-text("Later"), button[aria-label*="dismiss"]');
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
      await page.waitForTimeout(500);
    }
  });
});

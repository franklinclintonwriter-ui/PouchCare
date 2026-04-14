import { test, expect } from '@playwright/test';

async function staffLogin(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('you@company.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/$|^\/(?!login)/, { timeout: 30_000 });
}

test.describe('Management RBAC', () => {
  test('CEO can open role permissions', async ({ page }) => {
    test.setTimeout(60_000);
    await staffLogin(page, 'ceo@pouchcare.com', 'Password123!');
    await page.goto('/settings/role-permissions');
    await expect(page.getByTestId('role-permissions-card')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /management role access/i })).toBeVisible();
  });

  test('Staff user sees access denied on payroll when not allowed', async ({ page }) => {
    test.setTimeout(60_000);
    await staffLogin(page, 'staff1@pouchcare.com', 'Password123!');
    await page.goto('/payroll');
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible({ timeout: 15_000 });
  });

  test('Ops user can open payroll', async ({ page }) => {
    test.setTimeout(60_000);
    await staffLogin(page, 'ops@pouchcare.com', 'Password123!');
    await page.goto('/payroll');
    await expect(page).toHaveURL(/\/payroll$/);
    await expect(page.getByRole('heading', { name: /access denied/i })).toHaveCount(0);
    await expect(page.getByText('Total Payroll')).toBeVisible({ timeout: 20_000 });
  });
});

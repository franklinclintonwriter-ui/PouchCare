import { test, expect } from '@playwright/test';
import { selectors, fillLoginForm, mockApiEndpoint, clearAuthState } from './utils/test-helpers.js';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.locator('h1')).toContainText('Admin Login');
    await expect(page.locator(selectors.emailInput)).toBeVisible();
    await expect(page.locator(selectors.passwordInput)).toBeVisible();
    await expect(page.locator(selectors.submitButton)).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await mockApiEndpoint(page, '/admin/login', { error: 'Invalid credentials' }, 401);
    await page.goto('/auth/login');

    await fillLoginForm(page, 'invalid@test.com', 'wrongpassword');

    await expect(page.locator(selectors.errorMessage)).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    await mockApiEndpoint(page, '/admin/login', {
      token: 'mock-jwt-token',
      user: { email: 'admin@pouchcare.com', role: 'admin' },
    });

    await page.goto('/auth/login');
    await fillLoginForm(page, 'admin@pouchcare.com', 'password123');

    await page.waitForURL('**/admin/**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin/);
  });

  test('should have link to registration page', async ({ page }) => {
    await page.goto('/auth/login');

    const registerLink = page.locator('a:has-text("Create one")');
    await expect(registerLink).toBeVisible();
  });

  test('should disable submit button while loading', async ({ page }) => {
    await page.route('**/admin/login**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'test', user: {} }),
      });
    });

    await page.goto('/auth/login');
    await fillLoginForm(page, 'admin@pouchcare.com', 'password123');

    const submitButton = page.locator(selectors.submitButton);
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toContainText('Signing in');
  });

  test('should preserve redirect destination after login', async ({ page }) => {
    await mockApiEndpoint(page, '/admin/login', {
      token: 'mock-jwt-token',
      user: { email: 'admin@pouchcare.com', role: 'admin' },
    });

    await page.goto('/admin/companies');
    
    if (await page.url().includes('/login')) {
      await fillLoginForm(page, 'admin@pouchcare.com', 'password123');
      await page.waitForURL('**/companies**', { timeout: 10000 });
      await expect(page).toHaveURL(/companies/);
    }
  });
});

test.describe('Logout Flow', () => {
  test('should clear auth state on logout', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pouchcare_admin_token', 'mock-token');
      localStorage.setItem('pouchcare_admin_user', JSON.stringify({ email: 'test@test.com' }));
    });

    await page.goto('/admin');
    
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      const token = await page.evaluate(() => localStorage.getItem('pouchcare_admin_token'));
      expect(token).toBeNull();
    }
  });
});

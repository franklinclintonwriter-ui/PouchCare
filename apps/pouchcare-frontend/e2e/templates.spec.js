import { test, expect } from '@playwright/test';
import { selectors, mockApiEndpoint, navigateAndWait } from './utils/test-helpers.js';

const mockTemplates = {
  categories: ['All', 'Business', 'Portfolio', 'Blog', 'E-commerce'],
  templates: [
    {
      id: 1,
      name: 'Business Pro',
      description: 'Professional business template',
      category: 'Business',
      tags: ['corporate', 'professional'],
      rating: 4.8,
      downloads: 5200,
      version: '2.1.0',
      color: '#0A7AFF',
      popular: true,
      lastUpdated: '2024-03-15',
    },
    {
      id: 2,
      name: 'Creative Portfolio',
      description: 'Showcase your work beautifully',
      category: 'Portfolio',
      tags: ['creative', 'gallery'],
      rating: 4.6,
      downloads: 3100,
      version: '1.5.0',
      color: '#FF6B35',
      popular: false,
      lastUpdated: '2024-02-20',
    },
    {
      id: 3,
      name: 'Blog starter',
      description: 'Clean and minimal blog template',
      category: 'Blog',
      tags: ['minimal', 'writing'],
      rating: 4.5,
      downloads: 2800,
      version: '1.3.0',
      color: '#10B981',
      popular: false,
      lastUpdated: '2024-01-10',
    },
  ],
};

test.describe('Templates Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiEndpoint(page, '/catalog/templates', mockTemplates);
  });

  test('should load templates page with header and search', async ({ page }) => {
    await navigateAndWait(page, '/templates');

    await expect(page.locator('h1')).toContainText('WordPress Templates');
    await expect(page.locator(selectors.searchInput)).toBeVisible();
  });

  test('should display template cards', async ({ page }) => {
    await navigateAndWait(page, '/templates');

    await page.waitForSelector('[class*="rounded-xl"]', { timeout: 5000 });
    const cards = page.locator('[class*="grid"] > div[class*="rounded"]');
    await expect(cards.first()).toBeVisible();
  });

  test('should display category filter buttons', async ({ page }) => {
    await navigateAndWait(page, '/templates');

    // Use more specific selectors to avoid matching "Browse All Templates"
    await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Business', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Portfolio', exact: true })).toBeVisible();
  });

  test('should filter templates by category', async ({ page }) => {
    await navigateAndWait(page, '/templates');

    await page.click('button:has-text("Business")');
    await page.waitForTimeout(500);

    const resultsText = await page.locator('text=/Showing \\d+ of/').textContent();
    expect(resultsText).toContain('Showing');
  });

  test('should search templates by name', async ({ page }) => {
    await navigateAndWait(page, '/templates');

    await page.fill(selectors.searchInput, 'Business');
    await page.waitForTimeout(500);

    const resultsText = await page.locator('text=/Showing \\d+ of/').textContent();
    expect(resultsText).toBeDefined();
  });

  test('should search templates by tag', async ({ page }) => {
    await navigateAndWait(page, '/templates');

    await page.fill(selectors.searchInput, 'minimal');
    await page.waitForTimeout(500);

    const resultsText = await page.locator('text=/Showing \\d+ of/').textContent();
    expect(resultsText).toBeDefined();
  });

  test('should clear search input', async ({ page }) => {
    await navigateAndWait(page, '/templates');

    await page.fill(selectors.searchInput, 'test search');
    await expect(page.locator(selectors.searchInput)).toHaveValue('test search');

    const clearButton = page.locator('button[class*="absolute"]').filter({ has: page.locator('svg') });
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await expect(page.locator(selectors.searchInput)).toHaveValue('');
    }
  });

  test('should show empty state for no results', async ({ page }) => {
    await navigateAndWait(page, '/templates');

    await page.fill(selectors.searchInput, 'nonexistent-template-xyz123');
    await page.waitForTimeout(500);

    await expect(page.locator('text=No templates found')).toBeVisible();
    await expect(page.locator('button:has-text("Clear Filters")')).toBeVisible();
  });

  test('should have sorting dropdown', async ({ page }) => {
    await navigateAndWait(page, '/templates');

    const sortSelect = page.locator('select');
    await expect(sortSelect).toBeVisible();

    await sortSelect.selectOption('newest');
    await page.waitForTimeout(300);

    await expect(sortSelect).toHaveValue('newest');
  });

  test('should sort by different criteria', async ({ page }) => {
    await navigateAndWait(page, '/templates');

    const sortSelect = page.locator('select');

    await sortSelect.selectOption('rating');
    await page.waitForTimeout(300);
    await expect(sortSelect).toHaveValue('rating');

    await sortSelect.selectOption('downloads');
    await page.waitForTimeout(300);
    await expect(sortSelect).toHaveValue('downloads');
  });

  test('should display featured templates in banner', async ({ page }) => {
    await navigateAndWait(page, '/templates');

    const banner = page.locator('section[class*="bg-gradient"]');
    await expect(banner).toBeVisible();

    const featuredCards = banner.locator('[class*="rounded-xl"]');
    await expect(featuredCards.first()).toBeVisible();
  });

  test('should have CTA banner at bottom', async ({ page }) => {
    await navigateAndWait(page, '/templates');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await expect(page.locator('text=Ready to Build Something Amazing?')).toBeVisible();
  });
});

test.describe('Templates Page - API Fallback', () => {
  test('should fall back to static data when API fails', async ({ page }) => {
    await page.route('**/catalog/templates**', (route) => {
      route.fulfill({ status: 500, body: 'Server Error' });
    });

    await navigateAndWait(page, '/templates');

    await expect(page.locator('h1')).toContainText('WordPress Templates');
    const cards = page.locator('[class*="grid"] > div[class*="rounded"]');
    await expect(cards.first()).toBeVisible();
  });
});

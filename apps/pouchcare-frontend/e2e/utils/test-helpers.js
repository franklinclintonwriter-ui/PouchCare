/**
 * E2E Test Utilities for PouchCare Frontend
 */

/**
 * Common selectors used across tests
 */
export const selectors = {
  // Auth
  loginForm: 'form',
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  submitButton: 'button[type="submit"]',
  errorMessage: '.bg-red-50',

  // Navigation
  navLink: (text) => `a:has-text("${text}")`,
  pageTitle: 'h1',

  // Templates page
  searchInput: 'input[placeholder*="Search"]',
  categoryButton: (cat) => `button:has-text("${cat}")`,
  templateCard: '[class*="rounded-xl"][class*="shadow"]',
  sortSelect: 'select',
  resultsCount: 'text=/Showing \\d+ of \\d+ templates/',
  clearFiltersButton: 'button:has-text("Clear Filters")',

  // Admin dashboard
  statCard: '[class*="StatCard"], [class*="stat-card"], .grid > div',
  dataTable: 'table',
  tableRow: 'tbody tr',
};

/**
 * Mock admin authentication state by setting localStorage
 * @param {import('@playwright/test').Page} page
 * @param {object} options
 * @param {string} options.email
 * @param {string} options.role
 */
export async function mockAuthState(page, { email = 'admin@pouchcare.com', role = 'admin' } = {}) {
  await page.addInitScript(({ email, role }) => {
    const mockToken = btoa(JSON.stringify({ email, role, exp: Date.now() + 3600000 }));
    const mockUser = { email, role, name: 'Test User' };
    localStorage.setItem('pouchcare_admin_token', mockToken);
    localStorage.setItem('pouchcare_admin_user', JSON.stringify(mockUser));
  }, { email, role });
}

/**
 * Clear authentication state
 * @param {import('@playwright/test').Page} page
 */
export async function clearAuthState(page) {
  await page.addInitScript(() => {
    localStorage.removeItem('pouchcare_admin_token');
    localStorage.removeItem('pouchcare_admin_user');
  });
}

/**
 * Wait for API response and optionally mock it
 * @param {import('@playwright/test').Page} page
 * @param {string} urlPattern - URL pattern to match
 * @param {object} mockResponse - Optional response to mock
 */
export async function waitForApiResponse(page, urlPattern, mockResponse = null) {
  if (mockResponse) {
    await page.route(urlPattern, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    });
  }
  return page.waitForResponse((response) =>
    response.url().includes(urlPattern) && response.status() === 200
  );
}

/**
 * Mock API endpoint with a custom response
 * @param {import('@playwright/test').Page} page
 * @param {string} urlPattern
 * @param {object} response
 * @param {number} status
 */
export async function mockApiEndpoint(page, urlPattern, response, status = 200) {
  await page.route(`**${urlPattern}**`, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Wait for network to be idle (useful after navigation)
 * @param {import('@playwright/test').Page} page
 * @param {number} timeout
 */
export async function waitForNetworkIdle(page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Take a named screenshot for visual comparison
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
export async function takeNamedScreenshot(page, name) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
}

/**
 * Fill login form and submit
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function fillLoginForm(page, email, password) {
  await page.fill(selectors.emailInput, email);
  await page.fill(selectors.passwordInput, password);
  await page.click(selectors.submitButton);
}

/**
 * Navigate and wait for page to fully load
 * @param {import('@playwright/test').Page} page
 * @param {string} path
 */
export async function navigateAndWait(page, path) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

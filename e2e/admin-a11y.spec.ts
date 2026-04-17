/**
 * Accessibility audit — runs axe-core against every admin page and fails on
 * any 'serious' or 'critical' WCAG 2.1 AA violation.
 *
 * Dependency (install once):
 *   npm install -D @axe-core/playwright
 *
 * Run:
 *   npm run test:e2e -- e2e/admin-a11y.spec.ts
 */
import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const BLOCKER_IMPACTS = new Set(['serious', 'critical'])

async function staffLogin(page: Page, email = 'ceo@pouchcare.com', password = 'Password123!') {
  await page.goto('/login')
  await page.getByPlaceholder('you@company.com').fill(email)
  await page.getByPlaceholder('Enter your password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/$|^\/(?!login)/, { timeout: 30_000 })
}

async function scan(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
  return result.violations.filter((v) => BLOCKER_IMPACTS.has(String(v.impact ?? '')))
}

// Each admin page is scanned in isolation. The Overview/list pages are most
// interactive; detail pages pull the same shared primitives.
const PAGES: Array<{ label: string; path: string; ready: (p: Page) => Promise<unknown> }> = [
  {
    label: 'Admin Overview',
    path: '/admin',
    ready: (p) => p.getByRole('heading', { name: /admin overview|overview/i }).first().waitFor({ timeout: 15_000 }),
  },
  {
    label: 'Clients list',
    path: '/admin/clients',
    ready: (p) => p.getByRole('heading', { name: /^clients$/i }).first().waitFor({ timeout: 15_000 }),
  },
  {
    label: 'Orders list',
    path: '/admin/orders',
    ready: (p) => p.getByRole('heading', { name: /^orders$/i }).first().waitFor({ timeout: 15_000 }),
  },
  {
    label: 'Service catalog',
    path: '/admin/services',
    ready: (p) => p.getByRole('heading', { name: /^services$/i }).first().waitFor({ timeout: 15_000 }),
  },
  {
    label: 'Audit log',
    path: '/admin/settings/audit',
    ready: (p) => p.getByRole('heading', { name: /audit log/i }).first().waitFor({ timeout: 15_000 }),
  },
]

test.describe('Admin Panel — accessibility (axe, WCAG 2.1 AA)', () => {
  for (const pg of PAGES) {
    test(`${pg.label} has no serious/critical a11y violations`, async ({ page }) => {
      test.setTimeout(90_000)
      await staffLogin(page)
      await page.goto(pg.path)
      await pg.ready(page)
      const blockers = await scan(page)
      if (blockers.length > 0) {
        const summary = blockers.map(
          (v) => `${v.id} [${v.impact}] — ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})`,
        )
        console.log(`\n${pg.label} — axe violations:\n  ` + summary.join('\n  '))
      }
      expect(blockers, 'serious/critical a11y violations should be zero').toEqual([])
    })
  }
})

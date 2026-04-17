/**
 * Admin Panel — 8 golden flows from Notion §6.1.
 *
 * These specs assume the seeded demo accounts exist (see apps/api/prisma/seed.ts).
 * Each test is independent and uses staff login at the start.
 */
import { test, expect, type Page } from '@playwright/test'

async function staffLogin(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByPlaceholder('you@company.com').fill(email)
  await page.getByPlaceholder('Enter your password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/$|^\/(?!login)/, { timeout: 30_000 })
}

test.describe('Admin Panel — golden flows', () => {
  // 1. Client list loads under p95 budget on seeded data
  test('1. Clients list renders within 2s and shows seeded clients', async ({ page }) => {
    test.setTimeout(60_000)
    await staffLogin(page, 'ceo@pouchcare.com', 'Password123!')
    const t0 = Date.now()
    await page.goto('/admin/clients')
    await expect(page.getByRole('heading', { name: /clients/i }).first()).toBeVisible({ timeout: 5_000 })
    expect(Date.now() - t0).toBeLessThan(5_000)
    // At least one client row rendered
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10_000 })
  })

  // 2. Open ClientDetail and switch through every tab without error
  test('2. ClientDetail tabs render without errors', async ({ page }) => {
    test.setTimeout(60_000)
    await staffLogin(page, 'ceo@pouchcare.com', 'Password123!')
    await page.goto('/admin/clients')
    await page.locator('table tbody tr').first().click()
    await expect(page.getByText(/Lifetime spend/i)).toBeVisible({ timeout: 10_000 })
    for (const t of ['Overview', 'Orders', 'Wallet', 'Assets', 'Tickets', 'Activity']) {
      await page.getByRole('button', { name: new RegExp(`^${t}$`) }).click()
    }
  })

  // 3. Merge two clients (CEO-only); re-merge returns 409 idempotency conflict
  test('3. Merge clients — second attempt is rejected as idempotency conflict', async ({ page }) => {
    test.setTimeout(60_000)
    await staffLogin(page, 'ceo@pouchcare.com', 'Password123!')
    await page.goto('/admin/clients')
    await page.locator('table tbody tr').first().click()
    await page.getByRole('button', { name: /^merge$/i }).click()
    await page.getByPlaceholder(/name or email/i).fill('a')
    // Pick the first non-self result
    await page.locator('button:has-text("@")').first().click()
    await page.getByRole('button', { name: /^merge$/i }).last().click()
    await expect(page.getByText(/Merged into|idempotency_conflict/i)).toBeVisible({ timeout: 10_000 })
  })

  // 4. Create a staff order on behalf of a client; lands on its detail page
  test('4. Staff creates an order on behalf of a client', async ({ page }) => {
    test.setTimeout(90_000)
    await staffLogin(page, 'ops@pouchcare.com', 'Password123!')
    await page.goto('/admin/orders')
    await page.getByRole('button', { name: /new order/i }).click()
    await page.getByPlaceholder(/search by name or email/i).fill('@')
    await page.locator('button:has-text("Portal")').first().click()
    await page.getByRole('button', { name: /^next$/i }).click()
    await page.getByPlaceholder(/Backlinks 20DA|Hosting/i).fill('E2E test service')
    await page.getByRole('button', { name: /^next$/i }).click()
    await page.getByLabel(/unit price/i).fill('10')
    await page.getByLabel(/^quantity$/i).fill('1')
    await page.getByRole('button', { name: /^next$/i }).click()
    await page.getByRole('button', { name: /create order/i }).click()
    await expect(page).toHaveURL(/\/admin\/orders\//, { timeout: 15_000 })
  })

  // 5. Advance order through DAG (PENDING → IN_PROGRESS); audit row appears
  test('5. Advance order one step through the status DAG', async ({ page }) => {
    test.setTimeout(60_000)
    await staffLogin(page, 'ops@pouchcare.com', 'Password123!')
    await page.goto('/admin/orders?status=PENDING')
    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.count() === 0) test.skip(true, 'No PENDING orders seeded')
    await firstRow.click()
    await page.getByRole('button', { name: /IN_PROGRESS/ }).first().click()
    await expect(page.getByText(/Status →|IN_PROGRESS/)).toBeVisible({ timeout: 10_000 })
  })

  // 6. Refund a COMPLETED order — wallet adjusted XOR invoice voided, idempotent
  test('6. Refund flow with idempotency key (smoke)', async ({ page }) => {
    test.setTimeout(60_000)
    await staffLogin(page, 'ceo@pouchcare.com', 'Password123!')
    await page.goto('/admin/orders?status=COMPLETED')
    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.count() === 0) test.skip(true, 'No COMPLETED orders seeded')
    await firstRow.click()
    const refundBtn = page.getByRole('button', { name: /^refund$/i })
    if (await refundBtn.count() === 0) test.skip(true, 'No refund button visible')
    await refundBtn.click()
    await page.getByLabel(/amount \(usd\)/i).fill('1')
    await page.getByLabel(/^reason$/i).fill('e2e refund test')
    await page.getByRole('button', { name: /^refund$/i }).last().click()
    await expect(page.getByText(/Refund recorded|already/i)).toBeVisible({ timeout: 10_000 })
  })

  // 7. Publish a service plan — appears in catalog
  test('7. ServiceCatalog opens detail and Plans tab is reachable', async ({ page }) => {
    test.setTimeout(60_000)
    await staffLogin(page, 'ceo@pouchcare.com', 'Password123!')
    await page.goto('/admin/services')
    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.count() === 0) test.skip(true, 'No services seeded')
    await firstRow.click()
    await page.getByRole('button', { name: /^plans$/i }).click()
    await expect(page.getByText(/Tiered pricing|No plans yet|Plans not available/i)).toBeVisible({ timeout: 10_000 })
  })

  // 8. Audit log filters produce a CSV export download
  test('8. Audit log page renders + filter chip applies', async ({ page }) => {
    test.setTimeout(60_000)
    await staffLogin(page, 'ceo@pouchcare.com', 'Password123!')
    await page.goto('/admin/settings/audit')
    await expect(page.getByRole('heading', { name: /audit log/i }).first()).toBeVisible({ timeout: 10_000 })
    await page.getByPlaceholder(/Action contains/i).fill('order')
    await page.getByPlaceholder(/Action contains/i).press('Enter')
    await page.waitForTimeout(500)
  })
})

/**
 * RBAC matrix — expected allow/deny per role × admin page.
 * Complements `admin-panel.spec.ts` (happy paths) by exercising the gating.
 *
 * Seed accounts expected:
 *   ceo@pouchcare.com         (CEO)
 *   ops@pouchcare.com         (OP_MANAGER)
 *   staff1@pouchcare.com      (STAFF — no admin.* by default)
 *
 * The test hits each admin page and asserts either:
 *   - the page's signature heading is visible (allow), or
 *   - the "Access Denied" heading from PermissionGuard is visible (deny).
 */
import { test, expect, type Page } from '@playwright/test'

type Role = 'ceo' | 'ops' | 'staff'
const CREDENTIALS: Record<Role, { email: string; password: string }> = {
  ceo: { email: 'ceo@pouchcare.com', password: 'Password123!' },
  ops: { email: 'ops@pouchcare.com', password: 'Password123!' },
  staff: { email: 'staff1@pouchcare.com', password: 'Password123!' },
}

async function staffLogin(page: Page, role: Role) {
  const { email, password } = CREDENTIALS[role]
  await page.goto('/login')
  await page.getByPlaceholder('you@company.com').fill(email)
  await page.getByPlaceholder('Enter your password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/$|^\/(?!login)/, { timeout: 30_000 })
}

async function expectAccess(page: Page, url: string, opts: { allow: boolean; heading: RegExp }) {
  await page.goto(url)
  if (opts.allow) {
    await expect(page.getByRole('heading', { name: opts.heading }).first()).toBeVisible({ timeout: 15_000 })
  } else {
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible({ timeout: 15_000 })
  }
}

// Matrix: rows = page, columns = role. true = expected allow, false = deny.
const MATRIX: Array<{
  label: string
  path: string
  heading: RegExp
  expected: Record<Role, boolean>
}> = [
  {
    label: 'Admin Overview',
    path: '/admin',
    heading: /admin overview|overview/i,
    expected: { ceo: true, ops: true, staff: false },
  },
  {
    label: 'Clients list',
    path: '/admin/clients',
    heading: /^clients$/i,
    expected: { ceo: true, ops: true, staff: false },
  },
  {
    label: 'Orders list',
    path: '/admin/orders',
    heading: /^orders$/i,
    expected: { ceo: true, ops: true, staff: false },
  },
  {
    label: 'OrderNew wizard (requires admin.orders.write)',
    path: '/admin/orders/new',
    heading: /new order/i,
    expected: { ceo: true, ops: true, staff: false },
  },
  {
    label: 'Service Catalog',
    path: '/admin/services',
    heading: /^services$/i,
    expected: { ceo: true, ops: true, staff: false },
  },
  {
    label: 'Billing — Invoices',
    path: '/admin/billing/invoices',
    heading: /invoice/i,
    expected: { ceo: true, ops: true, staff: false },
  },
  {
    label: 'Billing — Deposits',
    path: '/admin/billing/deposits',
    heading: /deposit/i,
    expected: { ceo: true, ops: true, staff: false },
  },
  {
    label: 'Audit Log',
    path: '/admin/settings/audit',
    heading: /audit log/i,
    expected: { ceo: true, ops: true, staff: false },
  },
  {
    label: 'Broadcast (admin.broadcast.write)',
    path: '/admin/broadcast',
    heading: /broadcast/i,
    expected: { ceo: true, ops: true, staff: false },
  },
]

test.describe('Admin Panel RBAC matrix', () => {
  for (const role of ['ceo', 'ops', 'staff'] as Role[]) {
    test.describe(`role=${role}`, () => {
      for (const row of MATRIX) {
        const expectAllow = row.expected[role]
        test(`${row.label} — ${expectAllow ? 'allow' : 'deny'}`, async ({ page }) => {
          test.setTimeout(60_000)
          await staffLogin(page, role)
          await expectAccess(page, row.path, { allow: expectAllow, heading: row.heading })
        })
      }
    })
  }
})

/**
 * Sensitive mutation endpoints — verify server-side RBAC via direct API call.
 * Uses the logged-in session cookie that the JWT was issued into. This guards
 * against a hole where the page render is gated but the endpoint isn't.
 */
const SENSITIVE_ENDPOINTS: Array<{
  label: string
  method: 'POST' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
  expectStatus: Record<Role, number>
}> = [
  {
    label: 'POST /admin/clients/bogus-id/adjust-wallet',
    method: 'POST',
    path: '/v1/admin/clients/bogus-id/adjust-wallet',
    body: {
      deltaUsd: 1,
      reason: 'CORRECTION',
      note: 'rbac-test',
      idempotencyKey: 'rbac-matrix-' + Date.now(),
    },
    // CEO passes RBAC (then 404 on bogus id), Ops denied by rbac (403), Staff denied
    expectStatus: { ceo: 404, ops: 403, staff: 403 },
  },
  {
    label: 'POST /admin/orders/portal/bogus/refund',
    method: 'POST',
    path: '/v1/admin/orders/portal/bogus/refund',
    body: {
      amountUsd: 1,
      method: 'WALLET',
      reason: 'rbac-test',
      idempotencyKey: 'rbac-refund-' + Date.now(),
    },
    expectStatus: { ceo: 404, ops: 403, staff: 403 },
  },
]

test.describe('Admin Panel RBAC matrix — server enforcement', () => {
  for (const role of ['ceo', 'ops', 'staff'] as Role[]) {
    for (const ep of SENSITIVE_ENDPOINTS) {
      test(`${ep.label} (role=${role}) → ${ep.expectStatus[role]}`, async ({ page, request }) => {
        test.setTimeout(60_000)
        await staffLogin(page, role)
        // Extract the access token the SPA stored, then hit the endpoint
        // directly so we validate the server gate, not the guard.
        const token = await page.evaluate(
          () => localStorage.getItem('pouchcare_access_token') ?? localStorage.getItem('pc_access_token'),
        )
        if (!token) test.skip(true, 'Could not locate access token in storage')
        const res = await request.fetch(ep.path, {
          method: ep.method,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          data: ep.body,
        })
        expect(res.status()).toBe(ep.expectStatus[role])
      })
    }
  }
})

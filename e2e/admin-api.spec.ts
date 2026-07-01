/**
 * API integration tests — hits every new /v1/admin/* endpoint directly via
 * the Playwright request fixture. Complements admin-rbac.spec.ts (which
 * exercises gating) by verifying happy-path responses, shape, and idempotency.
 *
 * Run:
 *   npm run test:e2e -- e2e/admin-api.spec.ts
 */
import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

const API_BASE = process.env.E2E_API_BASE ?? '/v1'

async function staffLoginAndGetToken(page: Page, email = 'ceo@pouchcare.com', password = 'Password123!') {
  await page.goto('/login')
  await page.getByPlaceholder('you@company.com').fill(email)
  await page.getByPlaceholder('Enter your password').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/$|^\/(?!login)/, { timeout: 30_000 })
  const token = await page.evaluate(
    () => localStorage.getItem('pouchcare_access_token') ?? localStorage.getItem('pc_access_token'),
  )
  if (!token) throw new Error('Could not locate access token after login')
  return token
}

function authed(request: APIRequestContext, token: string) {
  return {
    get: (path: string, params?: Record<string, string | number>) =>
      request.get(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: params as any,
      }),
    post: (path: string, body?: unknown) =>
      request.post(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: body,
      }),
    patch: (path: string, body?: unknown) =>
      request.patch(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: body,
      }),
  }
}

test.describe('Admin API — read endpoints', () => {
  let token: string

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    token = await staffLoginAndGetToken(page)
    await page.close()
  })

  test('GET /admin/overview returns the KPI envelope', async ({ request }) => {
    const a = authed(request, token)
    const res = await a.get('/admin/overview')
    expect(res.ok()).toBe(true)
    const body = await res.json()
    const data = body.data ?? body
    expect(data).toHaveProperty('clients')
    expect(data).toHaveProperty('orders')
    expect(data).toHaveProperty('revenue')
    expect(data).toHaveProperty('support')
    expect(typeof data.generatedAt).toBe('string')
  })

  test('GET /admin/clients returns paginated list with meta', async ({ request }) => {
    const a = authed(request, token)
    const res = await a.get('/admin/clients', { page: 1, limit: 5 })
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.meta).toBeTruthy()
    expect(body.meta.page).toBe(1)
  })

  test('GET /admin/orders accepts kind + status filters', async ({ request }) => {
    const a = authed(request, token)
    const res = await a.get('/admin/orders', { kind: 'portal', limit: 5 })
    expect(res.ok()).toBe(true)
    const body = await res.json()
    for (const o of body.data ?? []) {
      expect(o.kind).toBe('portal')
    }
  })

  test('GET /admin/services returns services (admin-scoped)', async ({ request }) => {
    const a = authed(request, token)
    const res = await a.get('/admin/services')
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(Array.isArray(body.data ?? body)).toBe(true)
  })

  test('GET /admin/audit returns paginated audit entries', async ({ request }) => {
    const a = authed(request, token)
    const res = await a.get('/admin/audit', { limit: 10 })
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(Array.isArray(body.data ?? body.items ?? [])).toBe(true)
  })
})

test.describe('Admin API — mutation shape', () => {
  let token: string

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    token = await staffLoginAndGetToken(page)
    await page.close()
  })

  test('POST /admin/clients/:id/adjust-wallet rejects missing fields', async ({ request }) => {
    const a = authed(request, token)
    const res = await a.post('/admin/clients/does-not-exist/adjust-wallet', {})
    // Validation error OR not-found — but never 500
    expect([400, 404, 422]).toContain(res.status())
  })

  test('POST /admin/clients/:id/adjust-wallet is idempotent on duplicate key', async ({ request }) => {
    const a = authed(request, token)
    // Fetch one real portal-member-backed client id
    const list = await a.get('/admin/clients', { limit: 50 })
    const body = await list.json()
    const member = (body.data ?? []).find((c: any) => c.portalMemberId)
    if (!member) test.skip(true, 'No portal-member-backed clients seeded')

    const idempotencyKey = `e2e-${Date.now()}`
    const payload = {
      deltaUsd: 0.01,
      reason: 'CORRECTION',
      note: 'integration test',
      idempotencyKey,
    }
    const first = await a.post(`/admin/clients/${member.id}/adjust-wallet`, payload)
    expect(first.ok()).toBe(true)
    // Same key + same body → 409 conflict
    const second = await a.post(`/admin/clients/${member.id}/adjust-wallet`, payload)
    expect(second.status()).toBe(409)
  })

  test('POST /admin/orders/:kind/:id/advance rejects illegal DAG transition', async ({ request }) => {
    const a = authed(request, token)
    const list = await a.get('/admin/orders', { kind: 'portal', status: 'COMPLETED', limit: 5 })
    const body = await list.json()
    const order = (body.data ?? [])[0]
    if (!order) test.skip(true, 'No COMPLETED portal orders seeded')

    // COMPLETED → PENDING is not in the DAG; expect 400/409
    const rawId = order.id.startsWith('portal:') ? order.id.slice('portal:'.length) : order.id
    const res = await a.post(`/admin/orders/portal/${rawId}/advance`, { to: 'PENDING' })
    expect([400, 409]).toContain(res.status())
  })
})

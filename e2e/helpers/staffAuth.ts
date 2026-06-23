import { expect, type APIRequestContext, type Page } from '@playwright/test'

export const API_BASE = process.env.E2E_API_BASE ?? '/v1'

export type StaffSession = {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string }
}

const HASH_COLLISION_MARKER = 'staff_sessions_refresh_token_hash_key'

async function waitForRetryBoundary() {
  await new Promise((resolve) => setTimeout(resolve, 1_100))
}

/**
 * Temporary PR-2.6 harness workaround: repeated same-account logins can collide
 * on `staff_sessions_refresh_token_hash_key` when the auth flow issues the same
 * refresh token within a one-second window. Keep the retry local to the tests;
 * auth/session logic is intentionally out of scope for this PR.
 */
export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password = 'Password123!',
): Promise<StaffSession> {
  let res = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  })
  if (!res.ok()) {
    const bodyText = await res.text()
    if (bodyText.includes(HASH_COLLISION_MARKER)) {
      await waitForRetryBoundary()
      res = await request.post(`${API_BASE}/auth/login`, {
        data: { email, password },
      })
    }
  }

  expect(res.ok()).toBe(true)
  const body = await res.json()
  const data = body.data ?? body
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user,
  }
}

export async function staffLogin(page: Page, email: string, password: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto('/login')
    await page.getByPlaceholder('you@company.com').fill(email)
    await page.getByPlaceholder('Enter your password').fill(password)
    await page.getByRole('button', { name: /sign in/i }).click()

    try {
      await page.waitForURL(/\/$|^\/(?!login)/, {
        timeout: attempt === 0 ? 5_000 : 30_000,
      })
      return
    } catch (error) {
      if (attempt === 0 && /\/login$/.test(page.url())) {
        await waitForRetryBoundary()
        continue
      }
      throw error
    }
  }
}

export function authed(request: APIRequestContext, token: string) {
  return {
    get: (path: string, params?: Record<string, string | number>) =>
      request.get(`${API_BASE}${path}`, {
        headers: { Authorization: 'Bearer ' + token },
        params: params as any,
      }),
    post: (path: string, body?: unknown) =>
      request.post(`${API_BASE}${path}`, {
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        data: body,
      }),
  }
}

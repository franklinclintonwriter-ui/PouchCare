import { expect, type APIRequestContext, type Page } from '@playwright/test'

export const API_BASE = process.env.E2E_API_BASE ?? '/v1'

export type StaffSession = {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string }
}

type QueryParams = Record<string, string | number | boolean>

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
  if (data?.requireTotp) {
    throw new Error(`apiLogin cannot use TOTP-enabled account: ${email}`)
  }
  const accessToken = data?.access_token
  const refreshToken = data?.refresh_token
  const userId = data?.user?.id
  const userEmail = data?.user?.email
  if (!accessToken || !refreshToken || !userId || !userEmail) {
    throw new Error(`apiLogin returned incomplete auth payload for account: ${email}`)
  }
  return {
    accessToken,
    refreshToken,
    user: { id: userId, email: userEmail },
  }
}

export async function staffLogin(page: Page, email: string, password: string) {
  for (let attemptIndex = 0; attemptIndex < 2; attemptIndex += 1) {
    await page.goto('/login')
    await page.getByPlaceholder('you@company.com').fill(email)
    await page.getByPlaceholder('Enter your password').fill(password)
    await page.getByRole('button', { name: /sign in/i }).click()

    try {
      await page.waitForURL(/\/$|^\/(?!login)/, {
        timeout: attemptIndex === 0 ? 5_000 : 30_000,
      })
      return
    } catch (error) {
      if (attemptIndex === 0 && /\/login$/.test(page.url())) {
        await waitForRetryBoundary()
        continue
      }
      throw error
    }
  }
}

export function authed(request: APIRequestContext, token: string) {
  const normalizeParams = (params?: QueryParams): Record<string, string> | undefined =>
    params
      ? Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]))
      : undefined

  return {
    get: (path: string, params?: QueryParams) =>
      request.get(`${API_BASE}${path}`, {
        headers: { Authorization: 'Bearer ' + token },
        params: normalizeParams(params),
      }),
    post: (path: string, body?: unknown) =>
      request.post(`${API_BASE}${path}`, {
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        data: body,
      }),
  }
}

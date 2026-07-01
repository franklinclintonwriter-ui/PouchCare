import { type APIRequestContext, type APIResponse, type Page } from '@playwright/test'

export const API_BASE = process.env.E2E_API_BASE ?? '/v1'

export type StaffSession = {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string }
}

type QueryParams = Record<string, string | number | boolean>

const HASH_COLLISION_MARKER = 'staff_sessions_refresh_token_hash_key'
const RATE_LIMIT_MARKER = 'too many requests'
const sessionCache = new Map<string, Promise<StaffSession>>()

function deterministicForwardedIp(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  const a = 1 + (hash % 254)
  const b = 1 + ((hash >>> 8) % 254)
  const c = 1 + ((hash >>> 16) % 254)
  return `10.${a}.${b}.${c}`
}

function shouldRetryLogin(status: number, bodyText: string): boolean {
  const lowerBody = bodyText.toLowerCase()
  if (bodyText.includes(HASH_COLLISION_MARKER)) return true
  if (status === 429 || lowerBody.includes(RATE_LIMIT_MARKER)) return true
  if (status >= 500) return true
  return false
}

async function withRateLimitRetry(requester: () => Promise<APIResponse>, maxRetries = 8): Promise<APIResponse> {
  let res = await requester()
  for (let attempt = 0; attempt < maxRetries && res.status() === 429; attempt += 1) {
    await waitForRetryBoundary()
    res = await requester()
  }
  return res
}

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
  const cacheKey = `${email}\u0000${password}`
  const cached = sessionCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const forwardedFor = deterministicForwardedIp(email)
  const loginPromise = (async (): Promise<StaffSession> => {
    let res = await request.post(`${API_BASE}/auth/login`, {
      headers: { 'x-forwarded-for': forwardedFor },
      data: { email, password },
    })

    let lastBodyText = ''
    for (let attempt = 0; attempt < 8 && !res.ok(); attempt += 1) {
      const status = res.status()
      const bodyText = await res.text()
      lastBodyText = bodyText
      if (!shouldRetryLogin(status, bodyText)) {
        break
      }
      await waitForRetryBoundary()
      res = await request.post(`${API_BASE}/auth/login`, {
        headers: { 'x-forwarded-for': forwardedFor },
        data: { email, password },
      })
    }

    if (!res.ok()) {
      if (!lastBodyText) {
        lastBodyText = await res.text()
      }
      throw new Error(
        `apiLogin failed for ${email}: status=${res.status()} body=${lastBodyText}`,
      )
    }
    const body = await res.json()
    const data = body.data ?? body
    if (data?.requireTotp) {
      throw new Error(
        `apiLogin cannot use TOTP-enabled accounts; use a non-TOTP seed account or UI-based auth flow: ${email}`,
      )
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
  })()

  sessionCache.set(cacheKey, loginPromise)
  try {
    return await loginPromise
  } catch (error) {
    sessionCache.delete(cacheKey)
    throw error
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

  const forwardedFor = deterministicForwardedIp(token)
  const headers = {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
    'x-forwarded-for': forwardedFor,
  }

  return {
    get: (path: string, params?: QueryParams) =>
      withRateLimitRetry(() => request.get(`${API_BASE}${path}`, {
        headers: {
          Authorization: 'Bearer ' + token,
          'x-forwarded-for': forwardedFor,
        },
        params: normalizeParams(params),
      })),
    post: (path: string, body?: unknown) =>
      withRateLimitRetry(() => request.post(`${API_BASE}${path}`, { headers, data: body })),
    put: (path: string, body?: unknown) =>
      withRateLimitRetry(() => request.put(`${API_BASE}${path}`, { headers, data: body })),
    patch: (path: string, body?: unknown) =>
      withRateLimitRetry(() => request.patch(`${API_BASE}${path}`, { headers, data: body })),
    delete: (path: string) =>
      withRateLimitRetry(() => request.delete(`${API_BASE}${path}`, { headers })),
  }
}

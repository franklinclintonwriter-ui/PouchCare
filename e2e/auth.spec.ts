import { test, expect, type APIRequestContext } from '@playwright/test';

const API_BASE = process.env.E2E_API_BASE ?? '/v1';

type StaffSession = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
};

async function staffLogin(
  request: APIRequestContext,
  email: string,
  password = 'Password123!',
): Promise<StaffSession> {
  let res = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  });
  if (!res.ok()) {
    const body = await res.json().catch(() => null);
    const message = JSON.stringify(body ?? {});
    if (message.includes('staff_sessions_refresh_token_hash_key')) {
      await new Promise((resolve) => setTimeout(resolve, 1_100));
      res = await request.post(`${API_BASE}/auth/login`, {
        data: { email, password },
      });
    }
  }
  expect(res.ok()).toBe(true);
  const body = await res.json();
  const data = body.data ?? body;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user,
  };
}

function authed(request: APIRequestContext, token: string) {
  return {
    post: (path: string, body?: unknown) =>
      request.post(`${API_BASE}${path}`, {
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        data: body,
      }),
  };
}

test.describe('Staff auth session revocation', () => {
  test('logout revokes the refresh token session', async ({ request }) => {
    const session = await staffLogin(request, 'content1@pouchcare.com');
    const api = authed(request, session.accessToken);

    const logoutRes = await api.post('/auth/logout', {
      refresh_token: session.refreshToken,
    });
    expect(logoutRes.ok()).toBe(true);

    const refreshRes = await request.post(`${API_BASE}/auth/refresh`, {
      data: { refresh_token: session.refreshToken },
    });
    expect(refreshRes.status()).toBe(401);
  });

  test('password change invalidates existing refresh token sessions', async ({ request }) => {
    const email = 'design1@pouchcare.com';
    const originalPassword = 'Password123!';
    const updatedPassword = 'Password123!X';
    const session = await staffLogin(request, email, originalPassword);
    const api = authed(request, session.accessToken);

    const changeRes = await api.post('/auth/change-password', {
      current_password: originalPassword,
      new_password: updatedPassword,
    });
    expect(changeRes.ok()).toBe(true);

    const refreshRes = await request.post(`${API_BASE}/auth/refresh`, {
      data: { refresh_token: session.refreshToken },
    });
    expect(refreshRes.status()).toBe(401);

    const updatedSession = await staffLogin(request, email, updatedPassword);
    const updatedApi = authed(request, updatedSession.accessToken);

    const restoreRes = await updatedApi.post('/auth/change-password', {
      current_password: updatedPassword,
      new_password: originalPassword,
    });
    expect(restoreRes.ok()).toBe(true);
  });
});

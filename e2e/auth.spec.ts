import { test, expect } from '@playwright/test';
import { API_BASE, apiLogin, authed } from './helpers/staffAuth';

type PortalSession = {
  accessToken: string;
  refreshToken: string;
};

async function portalLogin(
  request: Parameters<typeof test>[0]['request'],
  email: string,
  password: string,
): Promise<PortalSession> {
  const res = await request.post(`${API_BASE}/portal/login`, {
    data: { email, password },
  });
  expect(res.ok()).toBe(true);
  const body = await res.json();
  const data = body.data ?? body;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

test.describe('Staff auth session revocation', () => {
  test('logout revokes the refresh token session', async ({ request }) => {
    const session = await apiLogin(request, 'content1@pouchcare.com');
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
    const session = await apiLogin(request, email, originalPassword);
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

    const updatedSession = await apiLogin(request, email, updatedPassword);
    const updatedApi = authed(request, updatedSession.accessToken);

    const restoreRes = await updatedApi.post('/auth/change-password', {
      current_password: updatedPassword,
      new_password: originalPassword,
    });
    expect(restoreRes.ok()).toBe(true);
  });
});

test.describe('Portal auth session revocation', () => {
  test('logout revokes the refresh token session', async ({ request }) => {
    const session = await portalLogin(request, 'john@example.com', 'Password123!');
    const api = authed(request, session.accessToken);

    const logoutRes = await api.post('/portal/logout', {
      refresh_token: session.refreshToken,
    });
    expect(logoutRes.ok()).toBe(true);

    const refreshRes = await request.post(`${API_BASE}/portal/refresh`, {
      data: { refresh_token: session.refreshToken },
    });
    expect(refreshRes.status()).toBe(401);
  });

  test('password change invalidates existing refresh token sessions', async ({ request }) => {
    const email = 'john@example.com';
    const originalPassword = 'Password123!';
    const updatedPassword = 'Password123!X';
    const session = await portalLogin(request, email, originalPassword);
    const api = authed(request, session.accessToken);

    const changeRes = await api.post('/portal/change-password', {
      current_password: originalPassword,
      new_password: updatedPassword,
    });
    expect(changeRes.ok()).toBe(true);

    const refreshRes = await request.post(`${API_BASE}/portal/refresh`, {
      data: { refresh_token: session.refreshToken },
    });
    expect(refreshRes.status()).toBe(401);

    const updatedSession = await portalLogin(request, email, updatedPassword);
    const updatedApi = authed(request, updatedSession.accessToken);

    const restoreRes = await updatedApi.post('/portal/change-password', {
      current_password: updatedPassword,
      new_password: originalPassword,
    });
    expect(restoreRes.ok()).toBe(true);
  });
});

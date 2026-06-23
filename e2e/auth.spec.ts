import { test, expect } from '@playwright/test';
import { API_BASE, apiLogin, authed } from './helpers/staffAuth';

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

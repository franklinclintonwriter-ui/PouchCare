const ACCESS = "pouchcare_portal_access_token";
const REFRESH = "pouchcare_portal_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH, token);
}

export function clearPortalAuth(): void {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}

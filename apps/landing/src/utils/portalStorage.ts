const ACCESS = "pouchcare_portal_access_token";
const REFRESH = "pouchcare_portal_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS) ?? sessionStorage.getItem(ACCESS);
}

export function setAccessToken(token: string, remember = true): void {
  const keep = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  keep.setItem(ACCESS, token);
  other.removeItem(ACCESS);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH) ?? sessionStorage.getItem(REFRESH);
}

export function setRefreshToken(token: string, remember = true): void {
  const keep = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  keep.setItem(REFRESH, token);
  other.removeItem(REFRESH);
}

export function clearPortalAuth(): void {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  sessionStorage.removeItem(ACCESS);
  sessionStorage.removeItem(REFRESH);
}

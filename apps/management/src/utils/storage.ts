const TOKEN_KEY = 'pouchcare_access_token';
const REFRESH_KEY = 'pouchcare_refresh_token';
const USER_TYPE_KEY = 'pouchcare_user_type';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string, remember = true): void {
  const keep = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  keep.setItem(TOKEN_KEY, token);
  other.removeItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string, remember = true): void {
  const keep = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  keep.setItem(REFRESH_KEY, token);
  other.removeItem(REFRESH_KEY);
}

export function getUserType(): 'staff' | 'portal' | null {
  return (localStorage.getItem(USER_TYPE_KEY) ?? sessionStorage.getItem(USER_TYPE_KEY)) as 'staff' | 'portal' | null;
}

export function setUserType(type: 'staff' | 'portal', remember = true): void {
  const keep = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  keep.setItem(USER_TYPE_KEY, type);
  other.removeItem(USER_TYPE_KEY);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_TYPE_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(USER_TYPE_KEY);
}

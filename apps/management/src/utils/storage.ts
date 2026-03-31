const TOKEN_KEY = 'pouchcare_access_token';
const REFRESH_KEY = 'pouchcare_refresh_token';
const USER_TYPE_KEY = 'pouchcare_user_type';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

export function getUserType(): 'staff' | 'portal' | null {
  return localStorage.getItem(USER_TYPE_KEY) as 'staff' | 'portal' | null;
}

export function setUserType(type: 'staff' | 'portal'): void {
  localStorage.setItem(USER_TYPE_KEY, type);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_TYPE_KEY);
}

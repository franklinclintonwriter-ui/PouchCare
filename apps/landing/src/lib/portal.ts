/**
 * Client area on pouchcare.com — account pages live under `/my-accounts/*`;
 * signed-in app uses `/dashboard`.
 *
 * - `VITE_PORTAL_URL` — optional absolute base (e.g. `https://pouchcare.com` or
 *   `http://localhost:3001` when the marketing SPA runs on another origin). If
 *   unset, links are same-origin relative paths (correct when the landing site
 *   and client app are served from the same host).
 * - Path overrides: `VITE_PORTAL_LOGIN_PATH`, `VITE_PORTAL_REGISTER_PATH`,
 *   `VITE_PORTAL_DASHBOARD_PATH` (defaults below).
 */

const DEFAULT_LOGIN_PATH = "/my-accounts/login";
const DEFAULT_REGISTER_PATH = "/my-accounts/register";
const DEFAULT_DASHBOARD_PATH = "/dashboard";

const base = (): string => {
  const raw = import.meta.env.VITE_PORTAL_URL?.trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
};

function pathFromEnv(
  key:
    | "VITE_PORTAL_LOGIN_PATH"
    | "VITE_PORTAL_REGISTER_PATH"
    | "VITE_PORTAL_DASHBOARD_PATH",
  fallback: string,
): string {
  const raw = (import.meta.env[key] as string | undefined)?.trim();
  if (!raw) return fallback;
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, "") || fallback;
}

export function portalLoginUrl(): string {
  return `${base()}${pathFromEnv("VITE_PORTAL_LOGIN_PATH", DEFAULT_LOGIN_PATH)}`;
}

export function portalRegisterUrl(): string {
  return `${base()}${pathFromEnv(
    "VITE_PORTAL_REGISTER_PATH",
    DEFAULT_REGISTER_PATH,
  )}`;
}

export function portalDashboardUrl(): string {
  return `${base()}${pathFromEnv(
    "VITE_PORTAL_DASHBOARD_PATH",
    DEFAULT_DASHBOARD_PATH,
  )}`;
}

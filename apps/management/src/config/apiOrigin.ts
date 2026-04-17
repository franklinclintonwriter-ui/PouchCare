/**
 * In dev → empty (Vite proxy handles `/v1`).
 * In production (Cloudflare Pages) → defaults to `https://api.pouchcare.com`.
 * Override with `VITE_API_URL` env var.
 */
export function getApiOrigin(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw?.trim()) return raw.replace(/\/$/, "");
  // Production default: API lives on a separate subdomain
  if (
    typeof window !== "undefined" &&
    !window.location.hostname.match(/^(localhost|127\.)/)
  ) {
    return "https://api.pouchcare.com";
  }
  return "";
}

/** Axios `baseURL` for `/v1` routes. */
export function getAxiosBaseURL(): string {
  const o = getApiOrigin();
  return o ? `${o}/v1` : "/v1";
}

/**
 * WebSocket URL for attendance realtime. Prefer `VITE_WS_URL` when the API is on another host/port.
 * Example: `ws://127.0.0.1:7000/v1/realtime`
 *
 * Token is sent as the first message after connection (not in the URL) to avoid
 * leaking credentials in browser history, server logs and referrer headers.
 */
export function buildRealtimeWebSocketUrl(): string {
  const wsEnv = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();
  if (wsEnv) {
    try {
      new URL(wsEnv); // validate
      return wsEnv;
    } catch {
      /* fall through to same-origin */
    }
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/v1/realtime`;
}

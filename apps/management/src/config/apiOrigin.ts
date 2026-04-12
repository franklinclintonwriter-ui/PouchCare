/**
 * When empty, the app uses same-origin `/v1` (Vite dev proxy or reverse proxy in production).
 * Set `VITE_API_URL` to call the API directly (e.g. `http://127.0.0.1:7000`) when the SPA is not proxied.
 */
export function getApiOrigin(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (!raw?.trim()) return "";
  return raw.replace(/\/$/, "");
}

/** Axios `baseURL` for `/v1` routes. */
export function getAxiosBaseURL(): string {
  const o = getApiOrigin();
  return o ? `${o}/v1` : "/v1";
}

/**
 * WebSocket URL for attendance realtime. Prefer `VITE_WS_URL` when the API is on another host/port.
 * Example: `ws://127.0.0.1:7000/v1/realtime`
 */
export function buildRealtimeWebSocketUrl(accessToken: string): string {
  const wsEnv = (import.meta.env.VITE_WS_URL as string | undefined)?.trim();
  if (wsEnv) {
    try {
      const u = new URL(wsEnv);
      u.searchParams.set("token", accessToken);
      return u.href;
    } catch {
      /* fall through to same-origin */
    }
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/v1/realtime?token=${encodeURIComponent(accessToken)}`;
}

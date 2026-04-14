/**
 * In dev → empty (Vite proxy handles `/v1`).
 * In production (Cloudflare Pages) → defaults to `https://api.pouchcare.com`.
 * Override with `VITE_API_URL` env var.
 */
export function getApiOrigin(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (raw?.trim()) return raw.replace(/\/+$/, "");
  // Production default: API lives on a separate subdomain
  if (
    typeof window !== "undefined" &&
    !window.location.hostname.match(/^(localhost|127\.)/)
  ) {
    return "https://api.pouchcare.com";
  }
  return "";
}

export function getAxiosBaseURL(): string {
  const o = getApiOrigin();
  return o ? `${o}/v1` : "/v1";
}

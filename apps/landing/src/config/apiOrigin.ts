/** Empty → same-origin `/v1` (Vite dev proxy to API :7000). */
export function getApiOrigin(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (!raw?.trim()) return "";
  return raw.replace(/\/+$/, "");
}

export function getAxiosBaseURL(): string {
  const o = getApiOrigin();
  return o ? `${o}/v1` : "/v1";
}

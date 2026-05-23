/**
 * Node/Express API origin (auth, licenses, admin, customer, sites).
 * @returns {string} Empty string when no API is configured (e.g. production WP embed using relative REST only); otherwise no trailing slash.
 */
export function getNodeApiBase() {
  const fromWindow =
    typeof window !== "undefined" && typeof window.__POUCHCARE_API_URL__ === "string"
      ? window.__POUCHCARE_API_URL__
      : "";
  const fromEnv = typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_URL : "";
  const raw = String(fromWindow || fromEnv || "")
    .trim()
    .replace(/\/$/, "");
  if (raw) return raw;
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    return "http://localhost:7481";
  }
  return "";
}

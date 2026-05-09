import { ErrorType, createError } from "./errorTypes";

/**
 * Resolve the API base URL from environment variable or window global.
 * @param {string} envKey - import.meta.env key (e.g. "VITE_ADMIN_API_BASE")
 * @param {string} windowKey - window global key (e.g. "__POUCHCARE_ADMIN_API_BASE__")
 * @returns {string} The resolved base URL or empty string
 */
export function getApiBase(envKey, windowKey) {
  const envBase =
    typeof import.meta !== "undefined" ? import.meta.env?.[envKey] : "";
  const runtimeBase =
    typeof window !== "undefined" ? window[windowKey] : "";
  const base = runtimeBase || envBase || "";
  return typeof base === "string" ? base.trim() : "";
}

/**
 * Read a runtime string value from window.
 * @param {string} key - window property name
 * @returns {string}
 */
function getRuntimeValue(key) {
  if (typeof window === "undefined") return "";
  const value = window[key];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Search localStorage and sessionStorage for an auth token.
 * @param {string[]} tokenKeys - Keys to search in order
 * @param {string} [runtimeWindowKey] - Optional window global to check first
 * @returns {string} The first found token or empty string
 */
export function getAuthToken(tokenKeys, runtimeWindowKey) {
  if (runtimeWindowKey) {
    const runtimeToken = getRuntimeValue(runtimeWindowKey);
    if (runtimeToken) return runtimeToken;
  }

  if (typeof window === "undefined") return "";

  for (const key of tokenKeys) {
    try {
      const local = window.localStorage?.getItem(key);
      if (typeof local === "string" && local.trim()) return local.trim();
    } catch {
      // ignore
    }

    try {
      const session = window.sessionStorage?.getItem(key);
      if (typeof session === "string" && session.trim()) return session.trim();
    } catch {
      // ignore
    }
  }

  return "";
}

/**
 * Read a cookie value by name.
 * @param {string} name
 * @returns {string}
 */
function readCookie(name) {
  if (typeof document === "undefined" || !document.cookie) return "";
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapedName}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : "";
}

/**
 * Resolve CSRF token from window global, cookie, or meta tag.
 * @returns {string}
 */
export function getCsrfToken() {
  const runtimeCsrf = getRuntimeValue("__POUCHCARE_CSRF_TOKEN__");
  if (runtimeCsrf) return runtimeCsrf;

  const cookieToken = readCookie("XSRF-TOKEN");
  if (cookieToken) return cookieToken;

  if (typeof document !== "undefined") {
    const meta = document.querySelector("meta[name='csrf-token']");
    const content = meta?.getAttribute("content") || "";
    if (content.trim()) return content.trim();
  }

  return "";
}

/**
 * Resolve WP REST nonce from runtime global, cookie, or meta tag.
 * @returns {string}
 */
export function getWpNonce() {
  const runtimeKeys = [
    "__POUCHCARE_WP_NONCE__",
    "__POUCHCARE_NONCE__",
    "pouchcareNonce",
  ];

  for (const key of runtimeKeys) {
    const runtimeNonce = getRuntimeValue(key);
    if (runtimeNonce) return runtimeNonce;
  }

  const cookieNonce = readCookie("wp_rest_nonce") || readCookie("pouchcare_nonce");
  if (cookieNonce) return cookieNonce;

  if (typeof document !== "undefined") {
    const selectors = ["meta[name='wp-rest-nonce']", "meta[name='x-wp-nonce']"];
    for (const selector of selectors) {
      const content = document.querySelector(selector)?.getAttribute("content") || "";
      if (content.trim()) return content.trim();
    }
  }

  return "";
}

/**
 * Check whether a header exists on a plain object (case-insensitive).
 * @param {object} headers
 * @param {string} name
 * @returns {boolean}
 */
function hasHeader(headers, name) {
  const target = String(name || "").toLowerCase();
  return Object.keys(headers || {}).some((key) => key.toLowerCase() === target);
}

/**
 * Build request headers with auth token, CSRF token, and any extras.
 * @param {string[]} tokenKeys - Auth token storage keys
 * @param {string} [runtimeWindowKey] - Optional window global for auth token
 * @param {object|Headers} [extra] - Additional headers
 * @returns {object}
 */
export function buildRequestHeaders(tokenKeys, runtimeWindowKey, extra = {}) {
  const authToken = getAuthToken(tokenKeys, runtimeWindowKey);
  const csrfToken = getCsrfToken();
  const wpNonce = getWpNonce();
  const extraHeaders =
    extra instanceof Headers ? Object.fromEntries(extra.entries()) : extra;
  const headers = {
    ...(!hasHeader(extraHeaders, "Content-Type")
      ? { "Content-Type": "application/json" }
      : {}),
    ...extraHeaders,
  };

  if (authToken && !hasHeader(headers, "Authorization")) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (csrfToken && !hasHeader(headers, "X-CSRF-Token")) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  if (wpNonce && !hasHeader(headers, "X-WP-Nonce")) {
    headers["X-WP-Nonce"] = wpNonce;
  }

  return headers;
}

/**
 * Extract a human-readable message from a response body.
 * @param {*} body
 * @returns {string}
 */
function messageFromBody(body) {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (typeof body?.message === "string") return body.message;
  if (typeof body?.error === "string") return body.error;
  return "";
}

/**
 * Map HTTP status and error kind to a normalized error object.
 * @param {object} params
 * @param {string} [params.kind] - Error kind: "config", "network", or omit for HTTP
 * @param {number} [params.status]
 * @param {string} [params.path]
 * @param {*} [params.body]
 * @param {string} [params.message]
 * @param {string} [params.label] - Context label (e.g. "Admin API", "Customer API")
 * @returns {{ type: string, message: string, status: number, path: string, details: * }}
 */
export function normalizeApiError({
  kind = "unknown",
  status = 0,
  path = "",
  body = null,
  message = "",
  label = "API",
} = {}) {
  if (kind === "config") {
    return createError({
      type: ErrorType.CONFIG_ERROR,
      message: `${label} base is not configured`,
      status,
      path,
      details: body,
    });
  }

  if (kind === "network") {
    return createError({
      type: ErrorType.NETWORK_ERROR,
      message: message || `Failed to reach ${label}`,
      status,
      path,
      details: body,
    });
  }

  if (status === 401) {
    return createError({
      type: ErrorType.UNAUTHORIZED,
      message: message || "Unauthorized",
      status,
      path,
      details: body,
    });
  }

  if (status === 403) {
    return createError({
      type: ErrorType.FORBIDDEN,
      message: message || "Forbidden",
      status,
      path,
      details: body,
    });
  }

  if (status === 404) {
    return createError({
      type: ErrorType.NOT_FOUND,
      message: message || "Resource not found",
      status,
      path,
      details: body,
    });
  }

  if (status === 400 || status === 422) {
    return createError({
      type: ErrorType.VALIDATION_ERROR,
      message: message || "Validation failed",
      status,
      path,
      details: body,
    });
  }

  if (status >= 500) {
    return createError({
      type: ErrorType.SERVER_ERROR,
      message: message || "Server error",
      status,
      path,
      details: body,
    });
  }

  return createError({
    type: ErrorType.REQUEST_ERROR,
    message: message || "Request failed",
    status,
    path,
    details: body,
  });
}

/**
 * Parse JSON or text from a fetch Response.
 * @param {Response} res
 * @returns {Promise<*>}
 */
export async function parseResponseBody(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await res.text();
    return text || null;
  } catch {
    return null;
  }
}

/**
 * Core fetch wrapper with error normalization.
 * @param {string} apiBase - The API base URL
 * @param {string} path - Request path appended to apiBase
 * @param {object} [options] - fetch options (method, body, headers, etc.)
 * @param {object} [config]
 * @param {string[]} [config.tokenKeys] - Auth token storage keys
 * @param {string} [config.runtimeWindowKey] - Window global for auth token
 * @param {string} [config.label] - Context label for error messages
 * @returns {Promise<{ ok: boolean, status?: number, response?: Response, data?: *, skipped?: boolean, failed?: boolean, error?: object }>}
 */
export async function safeFetch(apiBase, path, options = {}, config = {}) {
  const { tokenKeys = [], runtimeWindowKey, label = "API" } = config;

  if (!apiBase) {
    return {
      ok: false,
      skipped: true,
      error: normalizeApiError({ kind: "config", path, label }),
    };
  }

  try {
    const res = await fetch(`${apiBase}${path}`, {
      credentials: "include",
      ...options,
      headers: buildRequestHeaders(
        tokenKeys,
        runtimeWindowKey,
        options.headers || {}
      ),
    });

    const data = await parseResponseBody(res);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        response: res,
        data,
        error: normalizeApiError({
          status: res.status,
          path,
          body: data,
          message: messageFromBody(data),
          label,
        }),
      };
    }

    return { ok: true, status: res.status, response: res, data };
  } catch (error) {
    return {
      ok: false,
      failed: true,
      error: normalizeApiError({
        kind: "network",
        path,
        message: error?.message || "Network request failed",
        label,
      }),
    };
  }
}

/**
 * Normalize a safeFetch result into a standard result shape.
 * @param {{ ok: boolean, skipped?: boolean, status?: number, error?: object, data?: * }} remote
 * @returns {{ ok: boolean, mode: string, status: number, error: object|null, data: *|null }}
 */
export function resultFromRemote(remote) {
  if (remote.ok) {
    return {
      ok: true,
      mode: "remote",
      status: remote.status,
      error: null,
      data: remote.data,
    };
  }
  if (remote.skipped) {
    return { ok: true, mode: "local", status: 0, error: null, data: null };
  }
  return {
    ok: false,
    mode: "fallback-local",
    status: remote.status || 0,
    error: remote.error || null,
    data: remote.data || null,
  };
}

/**
 * Read and parse JSON from localStorage.
 * @param {string} key - localStorage key
 * @param {*} fallback - Value to return on failure
 * @returns {*}
 */
export function readLocalStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Write JSON data to localStorage.
 * @param {string} key - localStorage key
 * @param {*} data - Data to serialize
 */
export function writeLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore storage write failures in MVP
  }
}

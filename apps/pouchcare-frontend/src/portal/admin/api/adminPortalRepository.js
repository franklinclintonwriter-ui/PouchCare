import { validateBillingPayload, validateCompanyPayload, validateEvent, validateTeamPayload } from "./contracts";
import { buildRequestHeaders as buildWpRestHeaders, parseResponseBody } from "../../shared/api/apiClient";

const STORAGE_KEY = "pouchcare_admin_portal_data";
const AUTH_TOKEN_KEYS = ["pouchcare_admin_token", "pouchcare_token", "auth_token"];
const WP_DESIGN_TOKENS_PATH = "/wp-json/pouchcare/v1/admin/design-tokens";

function getApiBase() {
  const envBase = typeof import.meta !== "undefined" ? import.meta.env?.VITE_ADMIN_API_BASE : "";
  const runtimeBase = typeof window !== "undefined" ? window.__POUCHCARE_ADMIN_API_BASE__ : "";
  return (runtimeBase || envBase || "").trim();
}

/** When the portal runs on another origin, set `VITE_WP_ORIGIN` or `window.__POUCHCARE_WP_ORIGIN__`. */
function getWordPressOrigin() {
  const envBase = typeof import.meta !== "undefined" ? import.meta.env?.VITE_WP_ORIGIN : "";
  const runtimeBase = typeof window !== "undefined" ? window.__POUCHCARE_WP_ORIGIN__ : "";
  return (runtimeBase || envBase || "").trim().replace(/\/$/, "");
}

function wordPressDesignTokensUrl() {
  const origin = getWordPressOrigin();
  return origin ? `${origin}${WP_DESIGN_TOKENS_PATH}` : WP_DESIGN_TOKENS_PATH;
}

function wordPressTokensSoftFailure(status) {
  return status === 401 || status === 403 || status === 404;
}

/**
 * WordPress `pouchcare/v1/admin/design-tokens` (theme option). Uses cookie + X-WP-Nonce when embedded in wp-admin.
 */
async function safeFetchWordPressDesignTokens(options = {}) {
  const url = wordPressDesignTokensUrl();
  try {
    const res = await fetch(url, {
      credentials: "include",
      ...options,
      headers: buildWpRestHeaders(AUTH_TOKEN_KEYS, "__POUCHCARE_ADMIN_TOKEN__", {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      }),
    });
    const data = await parseResponseBody(res);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        response: res,
        data,
        softFail: wordPressTokensSoftFailure(res.status),
        error: normalizeApiError({
          status: res.status,
          path: WP_DESIGN_TOKENS_PATH,
          body: data,
          message: messageFromBody(data),
        }),
      };
    }
    return { ok: true, status: res.status, response: res, data };
  } catch (error) {
    return {
      ok: false,
      failed: true,
      softFail: true,
      error: normalizeApiError({
        kind: "network",
        path: WP_DESIGN_TOKENS_PATH,
        message: error?.message || "Network request failed",
      }),
    };
  }
}

function mergeDualPersistResult(nodeRes, wpRes) {
  const nodeOk = nodeRes.ok;
  const nodeSkipped = !!nodeRes.skipped;
  const wpOk = wpRes.ok;
  const wpSoft = !!wpRes.softFail || !!wpRes.failed;

  if (nodeOk || wpOk) {
    return { ok: true, skipped: false, node: nodeRes, wp: wpRes };
  }
  if (nodeSkipped && wpSoft) {
    return { ok: true, skipped: true, node: nodeRes, wp: wpRes };
  }
  return {
    ok: false,
    skipped: false,
    error: nodeRes.error || wpRes.error,
    node: nodeRes,
    wp: wpRes,
  };
}

function getRuntimeValue(key) {
  if (typeof window === "undefined") return "";
  const value = window[key];
  return typeof value === "string" ? value.trim() : "";
}

function getAuthToken() {
  const runtimeToken = getRuntimeValue("__POUCHCARE_ADMIN_TOKEN__");
  if (runtimeToken) return runtimeToken;

  if (typeof window === "undefined") return "";

  for (const key of AUTH_TOKEN_KEYS) {
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

function readCookie(name) {
  if (typeof document === "undefined" || !document.cookie) return "";
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function getCsrfToken() {
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

function readLocal(fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore storage write failures in MVP
  }
}

function buildRequestHeaders(extra = {}) {
  const authToken = getAuthToken();
  const csrfToken = getCsrfToken();
  const headers = {
    "Content-Type": "application/json",
    ...extra,
  };

  if (authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (csrfToken && !headers["X-CSRF-Token"]) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  return headers;
}

function messageFromBody(body) {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (typeof body?.message === "string") return body.message;
  if (typeof body?.error === "string") return body.error;
  return "";
}

function normalizeApiError({ kind = "unknown", status = 0, path = "", body = null, message = "" } = {}) {
  if (kind === "config") {
    return {
      type: "config_error",
      message: "Admin API base is not configured",
      status,
      path,
      details: body,
    };
  }

  if (kind === "network") {
    return {
      type: "network_error",
      message: message || "Failed to reach admin API",
      status,
      path,
      details: body,
    };
  }

  if (status === 401) {
    return { type: "unauthorized", message: message || "Unauthorized", status, path, details: body };
  }

  if (status === 403) {
    return { type: "forbidden", message: message || "Forbidden", status, path, details: body };
  }

  if (status === 404) {
    return { type: "not_found", message: message || "Resource not found", status, path, details: body };
  }

  if (status === 400 || status === 422) {
    return { type: "validation_error", message: message || "Validation failed", status, path, details: body };
  }

  if (status >= 500) {
    return { type: "server_error", message: message || "Server error", status, path, details: body };
  }

  return {
    type: "request_error",
    message: message || "Request failed",
    status,
    path,
    details: body,
  };
}

async function safeFetch(path, options = {}) {
  const apiBase = getApiBase();
  if (!apiBase) {
    return {
      ok: false,
      skipped: true,
      error: normalizeApiError({ kind: "config", path }),
    };
  }

  try {
    const res = await fetch(`${apiBase}${path}`, {
      credentials: "include",
      ...options,
      headers: buildRequestHeaders(options.headers || {}),
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
        }),
      };
    }

    return { ok: true, status: res.status, response: res, data };
  } catch (error) {
    return {
      ok: false,
      failed: true,
      error: normalizeApiError({ kind: "network", path, message: error?.message || "Network request failed" }),
    };
  }
}

function resultFromRemote(remote) {
  if (remote.ok) return { ok: true, mode: "remote", status: remote.status, error: null, data: remote.data };
  if (remote.skipped) return { ok: true, mode: "local", status: 0, error: null, data: null };
  return { ok: false, mode: "fallback-local", status: remote.status || 0, error: remote.error || null, data: remote.data || null };
}

const DESIGN_TOKENS_LOCAL_KEY = "pouchcare_design_tokens";

/**
 * Load Style Manager token state: remote admin snapshot slice, then localStorage fallback.
 * @param {Record<string, string>} defaults
 * @returns {Promise<Record<string, string>>}
 */
export async function fetchDesignTokens(defaults) {
  const remote = await safeFetch("/admin/design-tokens");
  if (remote.ok && remote.data?.tokens != null && typeof remote.data.tokens === "object") {
    return { ...defaults, ...remote.data.tokens };
  }

  const wp = await safeFetchWordPressDesignTokens({ method: "GET" });
  if (wp.ok && wp.data?.tokens != null && typeof wp.data.tokens === "object") {
    return { ...defaults, ...wp.data.tokens };
  }

  try {
    const raw = localStorage.getItem(DESIGN_TOKENS_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return { ...defaults, ...parsed };
      }
    }
  } catch {
    // ignore
  }
  return { ...defaults };
}

/**
 * Persist design tokens to the admin API (merges into portal snapshot) and localStorage.
 * @param {Record<string, string>} tokens
 */
export async function persistDesignTokens(tokens) {
  try {
    localStorage.setItem(DESIGN_TOKENS_LOCAL_KEY, JSON.stringify(tokens));
  } catch {
    // ignore
  }

  const body = JSON.stringify({ tokens });
  const [node, wp] = await Promise.all([
    safeFetch("/admin/design-tokens", { method: "PUT", body }),
    safeFetchWordPressDesignTokens({ method: "PUT", body }),
  ]);

  return mergeDualPersistResult(node, wp);
}

/** Remove saved tokens from the API (Node or WordPress) and localStorage. */
export async function clearPersistedDesignTokens() {
  try {
    localStorage.removeItem(DESIGN_TOKENS_LOCAL_KEY);
  } catch {
    // ignore
  }

  const [node, wp] = await Promise.all([
    safeFetch("/admin/design-tokens", { method: "DELETE" }),
    safeFetchWordPressDesignTokens({ method: "DELETE" }),
  ]);

  return mergeDualPersistResult(node, wp);
}

export async function fetchAdminSnapshot(fallback) {
  const remote = await safeFetch("/admin/snapshot");
  if (remote.ok) {
    const snapshot = remote.data?.data || remote.data || fallback;
    writeLocal(snapshot);
    return snapshot;
  }
  return readLocal(fallback);
}

export async function persistAdminSnapshot(snapshot) {
  writeLocal(snapshot);
  const remote = await safeFetch("/admin/snapshot", {
    method: "PUT",
    body: JSON.stringify({ data: snapshot }),
  });
  return resultFromRemote(remote);
}

export async function persistAdminEvent(event) {
  const check = validateEvent(event);
  if (!check.ok) {
    return {
      ok: false,
      mode: "invalid",
      reason: check.reason,
      error: normalizeApiError({ kind: "request", message: check.reason }),
    };
  }

  const remote = await safeFetch("/admin/events", {
    method: "POST",
    body: JSON.stringify(event),
  });
  return resultFromRemote(remote);
}

async function syncCompanyCrud(event) {
  const { type, companyId, payload } = event || {};
  const map = {
    "company.create": { method: "POST", path: "/admin/companies", body: payload },
    "company.update": { method: "PATCH", path: `/admin/companies/${companyId}`, body: payload },
    "company.delete": { method: "DELETE", path: `/admin/companies/${companyId}` },
    "company.suspend": { method: "POST", path: `/admin/companies/${companyId}/suspend`, body: payload },
    "company.activate": { method: "POST", path: `/admin/companies/${companyId}/activate`, body: payload },
    "company.usage_limits.update": { method: "PATCH", path: `/admin/companies/${companyId}/usage-limits`, body: payload },
    "company.note.create": { method: "POST", path: `/admin/companies/${companyId}/notes`, body: payload },
    "company.note.update": { method: "PATCH", path: `/admin/companies/${companyId}/notes/${payload?.noteId}`, body: payload },
    "company.note.delete": { method: "DELETE", path: `/admin/companies/${companyId}/notes/${payload?.noteId}` },
  };

  const req = map[type];
  if (!req) return { ok: false, mode: "unknown" };

  const remote = await safeFetch(req.path, {
    method: req.method,
    ...(req.body ? { body: JSON.stringify(req.body) } : {}),
  });
  return resultFromRemote(remote);
}

async function syncTeamCrud(event) {
  const { type, memberId, payload } = event || {};
  const map = {
    "team.member.create": { method: "POST", path: "/admin/team-members", body: payload },
    "team.member.update": { method: "PATCH", path: `/admin/team-members/${memberId}`, body: payload },
    "team.member.delete": { method: "DELETE", path: `/admin/team-members/${memberId}` },
  };

  const req = map[type];
  if (!req) return { ok: false, mode: "unknown" };

  const remote = await safeFetch(req.path, {
    method: req.method,
    ...(req.body ? { body: JSON.stringify(req.body) } : {}),
  });
  return resultFromRemote(remote);
}

async function syncBillingCrud(event) {
  const { type, recordId, payload } = event || {};
  const map = {
    "billing.record.create": { method: "POST", path: "/admin/billing-records", body: payload },
    "billing.record.update": { method: "PATCH", path: `/admin/billing-records/${recordId}`, body: payload },
    "billing.record.delete": { method: "DELETE", path: `/admin/billing-records/${recordId}` },
  };

  const req = map[type];
  if (!req) return { ok: false, mode: "unknown" };

  const remote = await safeFetch(req.path, {
    method: req.method,
    ...(req.body ? { body: JSON.stringify(req.body) } : {}),
  });
  return resultFromRemote(remote);
}

export async function syncCompanyOperation(event) {
  const companyCheck = validateCompanyPayload(event?.payload || {});
  if (!companyCheck.ok && !["company.delete", "company.activate"].includes(event?.type)) {
    return { ok: false, mode: "invalid", reason: companyCheck.reason };
  }

  const crud = await syncCompanyCrud(event);
  if (crud.ok && crud.mode === "remote") return crud;
  return persistAdminEvent(event);
}

export async function syncTeamOperation(event) {
  const check = validateTeamPayload(event?.payload || {});
  if (!check.ok && event?.type === "team.member.create") return { ok: false, mode: "invalid", reason: check.reason };

  const crud = await syncTeamCrud(event);
  if (crud.ok && crud.mode === "remote") return crud;
  return persistAdminEvent(event);
}

export async function syncBillingOperation(event) {
  const check = validateBillingPayload(event?.payload || {});
  if (!check.ok && event?.type === "billing.record.create") return { ok: false, mode: "invalid", reason: check.reason };

  const crud = await syncBillingCrud(event);
  if (crud.ok && crud.mode === "remote") return crud;
  return persistAdminEvent(event);
}


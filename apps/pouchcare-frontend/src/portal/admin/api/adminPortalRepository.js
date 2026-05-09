import { validateBillingPayload, validateCompanyPayload, validateEvent, validateTeamPayload } from "./contracts";

const STORAGE_KEY = "pouchcare_admin_portal_data";
const AUTH_TOKEN_KEYS = ["pouchcare_admin_token", "pouchcare_token", "auth_token"];

function getApiBase() {
  const envBase = typeof import.meta !== "undefined" ? import.meta.env?.VITE_ADMIN_API_BASE : "";
  const runtimeBase = typeof window !== "undefined" ? window.__POUCHCARE_ADMIN_API_BASE__ : "";
  return (runtimeBase || envBase || "").trim();
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

async function parseResponseBody(res) {
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
  if (remote.ok && remote.data?.tokens && typeof remote.data.tokens === "object") {
    return { ...defaults, ...remote.data.tokens };
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
  return safeFetch("/admin/design-tokens", {
    method: "PUT",
    body: JSON.stringify({ tokens }),
  });
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


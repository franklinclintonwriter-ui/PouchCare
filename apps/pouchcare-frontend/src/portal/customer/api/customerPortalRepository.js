import {
  safeFetch,
  resultFromRemote,
  readLocalStorage,
  writeLocalStorage,
  getApiBase,
  normalizeApiError,
} from "../../shared/api/apiClient";

import {
  validateEvent,
  validateWebsitePayload,
  validateSubscriptionPayload,
  validatePluginPayload,
  validateProfilePayload,
  validateTicketPayload,
  validatePaymentMethodPayload,
  validateApiKeyPayload,
  validateSettingsPayload,
} from "./contracts";

const STORAGE_KEY = "pouchcare_customer_portal_data";
const ENV_KEY = "VITE_CUSTOMER_API_BASE";
const WINDOW_KEY = "__POUCHCARE_CUSTOMER_API_BASE__";
const AUTH_TOKEN_KEYS = ["pouchcare_customer_token", "pouchcare_token", "auth_token"];
const RUNTIME_TOKEN_KEY = "__POUCHCARE_CUSTOMER_TOKEN__";
const LABEL = "Customer API";

/**
 * Currently active company ID used for scoping API requests.
 * Set via `switchCompanyScope`.
 * @type {string|null}
 */
let _activeCompanyId = null;

function apiBase() {
  return getApiBase(ENV_KEY, WINDOW_KEY);
}

function fetchConfig() {
  return { tokenKeys: AUTH_TOKEN_KEYS, runtimeWindowKey: RUNTIME_TOKEN_KEY, label: LABEL };
}

async function customerFetch(path, options = {}) {
  const opts = { ...options };
  if (_activeCompanyId) {
    opts.headers = {
      ...(opts.headers || {}),
      "X-PouchCare-Company-Id": _activeCompanyId,
    };
  }
  return safeFetch(apiBase(), path, opts, fetchConfig());
}

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

export async function fetchCustomerSnapshot(fallback) {
  const remote = await customerFetch("/customer/snapshot");
  if (remote.ok) {
    const snapshot = remote.data?.data || remote.data || fallback;
    writeLocalStorage(STORAGE_KEY, snapshot);
    return snapshot;
  }
  return readLocalStorage(STORAGE_KEY, fallback);
}

/**
 * Snapshot (remote or local) plus authoritative profile fields from the API.
 */
export async function fetchCustomerPortalData(fallback) {
  const snapshot = await fetchCustomerSnapshot(fallback);
  const remote = await customerFetch("/customer/profile");
  if (!remote.ok || remote.data?.profile == null || typeof remote.data.profile !== "object") {
    return snapshot;
  }
  const merged = {
    ...snapshot,
    profile: {
      ...(snapshot && typeof snapshot.profile === "object" ? snapshot.profile : {}),
      ...remote.data.profile,
    },
  };
  writeLocalStorage(STORAGE_KEY, merged);
  return merged;
}

export async function persistCustomerSnapshot(snapshot) {
  writeLocalStorage(STORAGE_KEY, snapshot);
  const remote = await customerFetch("/customer/snapshot", {
    method: "PUT",
    body: JSON.stringify({ data: snapshot }),
  });
  return resultFromRemote(remote);
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function persistCustomerEvent(event) {
  const check = validateEvent(event);
  if (!check.ok) {
    return {
      ok: false,
      mode: "invalid",
      reason: check.reason,
      error: normalizeApiError({ kind: "request", message: check.reason, label: LABEL }),
    };
  }

  const remote = await customerFetch("/customer/events", {
    method: "POST",
    body: JSON.stringify(event),
  });
  return resultFromRemote(remote);
}

// ---------------------------------------------------------------------------
// CRUD sync helpers
// ---------------------------------------------------------------------------

async function syncWebsiteCrud(event) {
  const { type, websiteId, payload } = event || {};
  const map = {
    "website.create": { method: "POST", path: "/customer/websites", body: payload },
    "website.update": { method: "PATCH", path: `/customer/websites/${websiteId}`, body: payload },
    "website.delete": { method: "DELETE", path: `/customer/websites/${websiteId}` },
  };

  const req = map[type];
  if (!req) return { ok: false, mode: "unknown" };

  const remote = await customerFetch(req.path, {
    method: req.method,
    ...(req.body ? { body: JSON.stringify(req.body) } : {}),
  });
  return resultFromRemote(remote);
}

async function syncSubscriptionCrud(event) {
  const { type, subscriptionId, payload } = event || {};
  const map = {
    "subscription.create": { method: "POST", path: "/customer/subscriptions", body: payload },
    "subscription.update": { method: "PATCH", path: `/customer/subscriptions/${subscriptionId}`, body: payload },
    "subscription.delete": { method: "DELETE", path: `/customer/subscriptions/${subscriptionId}` },
  };

  const req = map[type];
  if (!req) return { ok: false, mode: "unknown" };

  const remote = await customerFetch(req.path, {
    method: req.method,
    ...(req.body ? { body: JSON.stringify(req.body) } : {}),
  });
  return resultFromRemote(remote);
}

async function syncPluginCrud(event) {
  const { type, pluginId, payload } = event || {};
  const map = {
    "plugin.create": { method: "POST", path: "/customer/plugins", body: payload },
    "plugin.update": { method: "PATCH", path: `/customer/plugins/${pluginId}`, body: payload },
    "plugin.delete": { method: "DELETE", path: `/customer/plugins/${pluginId}` },
  };

  const req = map[type];
  if (!req) return { ok: false, mode: "unknown" };

  const remote = await customerFetch(req.path, {
    method: req.method,
    ...(req.body ? { body: JSON.stringify(req.body) } : {}),
  });
  return resultFromRemote(remote);
}

async function syncProfileCrud(event) {
  const { type, payload } = event || {};
  if (type !== "profile.update") return { ok: false, mode: "unknown" };

  const remote = await customerFetch("/customer/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return resultFromRemote(remote);
}

async function syncSettingsCrud(event) {
  const { type, payload } = event || {};
  if (type !== "settings.update") return { ok: false, mode: "unknown" };

  const remote = await customerFetch("/customer/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return resultFromRemote(remote);
}

async function syncApiKeyCrud(event) {
  const { type, apiKeyId, payload } = event || {};
  const map = {
    "apiKey.create": { method: "POST", path: "/customer/api-keys", body: payload },
    "apiKey.delete": { method: "DELETE", path: `/customer/api-keys/${apiKeyId}` },
  };

  const req = map[type];
  if (!req) return { ok: false, mode: "unknown" };

  const remote = await customerFetch(req.path, {
    method: req.method,
    ...(req.body ? { body: JSON.stringify(req.body) } : {}),
  });
  return resultFromRemote(remote);
}

async function syncTicketCrud(event) {
  const { type, ticketId, payload } = event || {};
  const map = {
    "ticket.create": { method: "POST", path: "/customer/tickets", body: payload },
    "ticket.update": { method: "PATCH", path: `/customer/tickets/${ticketId}`, body: payload },
    "ticket.delete": { method: "DELETE", path: `/customer/tickets/${ticketId}` },
  };

  const req = map[type];
  if (!req) return { ok: false, mode: "unknown" };

  const remote = await customerFetch(req.path, {
    method: req.method,
    ...(req.body ? { body: JSON.stringify(req.body) } : {}),
  });
  return resultFromRemote(remote);
}

async function syncPaymentMethodCrud(event) {
  const { type, paymentMethodId, payload } = event || {};
  const map = {
    "paymentMethod.create": { method: "POST", path: "/customer/payment-methods", body: payload },
    "paymentMethod.delete": { method: "DELETE", path: `/customer/payment-methods/${paymentMethodId}` },
  };

  const req = map[type];
  if (!req) return { ok: false, mode: "unknown" };

  const remote = await customerFetch(req.path, {
    method: req.method,
    ...(req.body ? { body: JSON.stringify(req.body) } : {}),
  });
  return resultFromRemote(remote);
}

// ---------------------------------------------------------------------------
// Public sync operations (validate then CRUD, fall back to event persist)
// ---------------------------------------------------------------------------

export async function syncWebsiteOperation(event) {
  const check = validateWebsitePayload(event?.payload || {});
  if (!check.ok && event?.type === "website.create") {
    return { ok: false, mode: "invalid", reason: check.reason };
  }

  const crud = await syncWebsiteCrud(event);
  if (crud.ok && crud.mode === "remote") return crud;
  return persistCustomerEvent(event);
}

export async function syncSubscriptionOperation(event) {
  const check = validateSubscriptionPayload(event?.payload || {});
  if (!check.ok && event?.type === "subscription.create") {
    return { ok: false, mode: "invalid", reason: check.reason };
  }

  const crud = await syncSubscriptionCrud(event);
  if (crud.ok && crud.mode === "remote") return crud;
  return persistCustomerEvent(event);
}

export async function syncPluginOperation(event) {
  const check = validatePluginPayload(event?.payload || {});
  if (!check.ok && event?.type === "plugin.create") {
    return { ok: false, mode: "invalid", reason: check.reason };
  }

  const crud = await syncPluginCrud(event);
  if (crud.ok && crud.mode === "remote") return crud;
  return persistCustomerEvent(event);
}

export async function syncProfileOperation(event) {
  const check = validateProfilePayload(event?.payload || {});
  if (!check.ok) {
    return { ok: false, mode: "invalid", reason: check.reason };
  }

  const crud = await syncProfileCrud(event);
  if (crud.ok && crud.mode === "remote") return crud;
  return persistCustomerEvent(event);
}

export async function syncSettingsOperation(event) {
  const check = validateSettingsPayload(event?.payload || {});
  if (!check.ok) {
    return { ok: false, mode: "invalid", reason: check.reason };
  }

  const crud = await syncSettingsCrud(event);
  if (crud.ok && crud.mode === "remote") return crud;
  return persistCustomerEvent(event);
}

export async function syncApiKeyOperation(event) {
  const check = validateApiKeyPayload(event?.payload || {});
  if (!check.ok && event?.type === "apiKey.create") {
    return { ok: false, mode: "invalid", reason: check.reason };
  }

  const crud = await syncApiKeyCrud(event);
  if (crud.ok && crud.mode === "remote") return crud;
  return persistCustomerEvent(event);
}

export async function syncTicketOperation(event) {
  const check = validateTicketPayload(event?.payload || {});
  if (!check.ok && event?.type === "ticket.create") {
    return { ok: false, mode: "invalid", reason: check.reason };
  }

  const crud = await syncTicketCrud(event);
  if (crud.ok && crud.mode === "remote") return crud;
  return persistCustomerEvent(event);
}

export async function syncPaymentMethodOperation(event) {
  const check = validatePaymentMethodPayload(event?.payload || {});
  if (!check.ok && event?.type === "paymentMethod.create") {
    return { ok: false, mode: "invalid", reason: check.reason };
  }

  const crud = await syncPaymentMethodCrud(event);
  if (crud.ok && crud.mode === "remote") return crud;
  return persistCustomerEvent(event);
}

// ---------------------------------------------------------------------------
// Multi-company support
// ---------------------------------------------------------------------------

/**
 * Set the active company scope for all subsequent API calls.
 * Sends the `X-PouchCare-Company-Id` header with every request.
 *
 * @param {string} companyId - The company ID to scope requests to.
 * @returns {{ ok: boolean, companyId: string }}
 */
export function switchCompanyScope(companyId) {
  _activeCompanyId = companyId || null;
  return { ok: true, companyId: _activeCompanyId };
}

/**
 * Try a sequence of request candidates, falling back across 404/405 route mismatches.
 * @param {Array<{ method: string, path: string, body?: object }>} candidates
 * @returns {Promise<ReturnType<typeof resultFromRemote>>}
 */
async function runRouteFallback(candidates) {
  let lastRemote = null;

  for (const req of candidates) {
    const remote = await customerFetch(req.path, {
      method: req.method,
      ...(req.body ? { body: JSON.stringify(req.body) } : {}),
    });

    lastRemote = remote;

    if (remote.ok) return resultFromRemote(remote);

    const status = remote.status || 0;
    const isRouteMismatch = status === 404 || status === 405;
    if (!isRouteMismatch || remote.failed || remote.skipped) {
      return resultFromRemote(remote);
    }
  }

  return resultFromRemote(lastRemote || { ok: false, status: 404 });
}

/**
 * Sync a company invitation event to the backend.
 *
 * @param {{ type: string, payload: { id: string, email: string, role: string, companyId: string } }} event
 * @returns {Promise<import("../../shared/api/apiClient").ApiResult>}
 */
export async function syncCompanyInvitation(event) {
  const { type, payload } = event || {};
  const invitationId = payload?.id || payload?.invitationId || "";
  const companyId = payload?.companyId || _activeCompanyId || "";
  const candidates = [];

  if (type === "company.invitation.create") {
    if (!payload?.email || !payload?.role) {
      return { ok: false, mode: "invalid", reason: "Invitation email and role are required." };
    }

    candidates.push({ method: "POST", path: "/customer/invitations", body: payload });
    if (companyId) {
      candidates.push({
        method: "POST",
        path: `/customer/companies/${companyId}/invitations`,
        body: payload,
      });
    }
  } else if (
    type === "company.invitation.revoke" ||
    type === "company.invitation.cancel" ||
    type === "company.invitation.delete"
  ) {
    if (!invitationId) {
      return { ok: false, mode: "invalid", reason: "Invitation id is required." };
    }

    candidates.push({ method: "DELETE", path: `/customer/invitations/${invitationId}` });
    candidates.push({
      method: "POST",
      path: `/customer/invitations/${invitationId}/revoke`,
      body: { id: invitationId },
    });
    if (companyId) {
      candidates.push({
        method: "DELETE",
        path: `/customer/companies/${companyId}/invitations/${invitationId}`,
      });
    }
  } else {
    return { ok: false, mode: "unknown" };
  }

  const crud = await runRouteFallback(candidates);
  if (crud.ok && crud.mode === "remote") return crud;
  return persistCustomerEvent(event);
}

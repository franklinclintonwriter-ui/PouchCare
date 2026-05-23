/**
 * ══════════════════════════════════════════════════════════════════════════════
 * Customer Portal Repository — Data Source Strategy
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * This repository provides a unified data access layer for the customer portal.
 * It supports two runtime modes with automatic detection:
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ MODE: node (standalone)                                                     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ When: VITE_API_URL or VITE_CUSTOMER_API_BASE is set to a Node/Express URL   │
 * │       OR running in Vite dev mode (defaults to http://localhost:7481)       │
 * │                                                                             │
 * │ All requests route to the Node API at /customer/* endpoints:                │
 * │   • GET  /customer/snapshot       → fetchCustomerSnapshot                   │
 * │   • PUT  /customer/snapshot       → persistCustomerSnapshot                 │
 * │   • GET  /customer/profile        → fetchCustomerPortalData (profile merge) │
 * │   • PATCH /customer/profile       → syncProfileOperation                    │
 * │   • PATCH /customer/settings      → syncSettingsOperation                   │
 * │   • POST /customer/events         → persistCustomerEvent (offline sync)     │
 * │                                                                             │
 * │ Entity CRUD (websites, subscriptions, plugins, tickets, etc.):              │
 * │   • POST   /customer/{entity}           → create                            │
 * │   • PATCH  /customer/{entity}/{id}      → update                            │
 * │   • DELETE /customer/{entity}/{id}      → delete                            │
 * │                                                                             │
 * │ Invitations (multi-path fallback for API flexibility):                      │
 * │   • POST   /customer/invitations                                            │
 * │   • POST   /customer/companies/:companyId/invitations                       │
 * │   • DELETE /customer/invitations/:id                                        │
 * │   • POST   /customer/invitations/:id/revoke                                 │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ MODE: wordpress (embedded)                                                  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ When: No explicit API base is set AND not in Vite dev mode                  │
 * │       (e.g., React app bundled into a WordPress plugin/theme)               │
 * │                                                                             │
 * │ Requests use relative paths, resolved by the WP REST API:                   │
 * │   • /wp-json/pouchcare/v1/customer/*                                        │
 * │                                                                             │
 * │ The WordPress plugin should register matching REST routes that either:      │
 * │   a) Proxy to the Node API (hybrid architecture)                            │
 * │   b) Implement equivalent logic using WP database                           │
 * │                                                                             │
 * │ NOTE: As of this version, WP REST routes for customer portal are NOT        │
 * │ implemented. Track D in COMPLETION-PLAN.md tracks this work.                │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Local Storage Fallback                                                      │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ All snapshot/profile fetches cache to localStorage (STORAGE_KEY).           │
 * │ When the remote API fails, cached data is returned as a fallback.           │
 * │ Event persistence (persistCustomerEvent) provides offline-first sync.       │
 * └─────────────────────────────────────────────────────────────────────────────┘
 *
 * @see apps/api/src/routes/customer.js        — Node API profile/snapshot routes
 * @see apps/api/src/routes/customerEntities.js — Node API CRUD entity routes
 * @see docs/COMPLETION-PLAN.md                — Track C (this file), Track D (WP)
 */

import {
  safeFetch,
  resultFromRemote,
  readLocalStorage,
  writeLocalStorage,
  getApiBase,
  normalizeApiError,
} from "../../shared/api/apiClient";
import { getNodeApiBase } from "../../../config/apiBase.js";

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

// ---------------------------------------------------------------------------
// Portal mode detection
// ---------------------------------------------------------------------------

/**
 * Detect the current portal operating mode based on configuration.
 *
 * @returns {'node' | 'wordpress' | 'hybrid'} The detected mode:
 *   - 'node': Standalone Node/Express API (explicit URL or dev default)
 *   - 'wordpress': Embedded in WordPress (no API base, using relative WP REST)
 *   - 'hybrid': Both Node API and WP REST are available (future use)
 */
export function getPortalMode() {
  const explicitCustomerBase = getApiBase(ENV_KEY, WINDOW_KEY);
  const nodeBase = getNodeApiBase();
  const hasWpRest =
    typeof window !== "undefined" &&
    (typeof window.__POUCHCARE_WP_REST__ === "string" ||
      typeof window.wpApiSettings === "object");

  if (explicitCustomerBase || nodeBase) {
    if (hasWpRest) {
      return "hybrid";
    }
    return "node";
  }

  return "wordpress";
}

/**
 * Check if the portal is running in a specific mode.
 * @param {'node' | 'wordpress' | 'hybrid'} mode
 * @returns {boolean}
 */
export function isPortalMode(mode) {
  return getPortalMode() === mode;
}

function apiBase() {
  const explicit = getApiBase(ENV_KEY, WINDOW_KEY);
  if (explicit) return explicit;
  return getNodeApiBase();
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

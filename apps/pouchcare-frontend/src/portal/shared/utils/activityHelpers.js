/**
 * Shared helpers for activity feeds, audit logs, and notification lists.
 *
 * Both portals maintain append-only lists that need consistent id generation,
 * timestamp labelling, and cap enforcement. These helpers centralise that logic.
 */

import { createId } from "./createId.js";
import { nowLabel } from "./nowLabel.js";

// ---------------------------------------------------------------------------
// List-size caps
// ---------------------------------------------------------------------------

/** Maximum entries retained in an activity feed. */
export const ACTIVITY_CAP = 30;

/** Maximum entries retained in the audit log. */
export const AUDIT_CAP = 120;

/** Maximum entries retained in the notifications list. */
export const NOTIFICATION_CAP = 20;

// ---------------------------------------------------------------------------
// Entry factories
// ---------------------------------------------------------------------------

/**
 * Create a new activity-feed entry.
 *
 * @param {Object} params
 * @param {string} params.action  - Human-readable description of the action
 * @param {string} params.actor   - Name or id of the user who performed it
 * @param {string} [params.updated] - Timestamp label; defaults to nowLabel()
 * @returns {{ id: string, action: string, actor: string, updated: string }}
 */
export function createActivityEntry({ action, actor, updated }) {
  return {
    id: createId("act"),
    action,
    actor,
    updated: updated || nowLabel(),
  };
}

/**
 * Create a new audit-log entry.
 *
 * @param {Object} params
 * @param {string} params.action   - Description of the audited action
 * @param {string} params.actor    - Name or id of the acting user
 * @param {string} [params.target] - Entity or area affected; defaults to "Portal"
 * @param {*}      [params.metadata] - Arbitrary data attached to the entry
 * @returns {{ id: string, action: string, actor: string, target: string, metadata: *, updated: string }}
 */
export function createAuditEntry({ action, actor, target, metadata }) {
  return {
    id: createId("aud"),
    action,
    actor,
    target: target || "Portal",
    metadata: metadata || null,
    updated: nowLabel(),
  };
}

// ---------------------------------------------------------------------------
// List management
// ---------------------------------------------------------------------------

/**
 * Prepend an entry to a list and enforce a maximum length.
 *
 * Returns a new array -- the original is not mutated.
 *
 * @param {Array} list  - Existing list of entries
 * @param {*}     entry - New entry to prepend
 * @param {number} cap  - Maximum number of entries to retain
 * @returns {Array} A new array with the entry at the front, trimmed to cap
 */
export function pushToList(list, entry, cap) {
  return [entry, ...list].slice(0, cap);
}

/**
 * Structural and deep validation for admin portal snapshot JSON (workspace CRM).
 *
 * This module provides two validation modes:
 * - Light validation (default): Checks array fields are arrays (fast, backward-compatible)
 * - Deep validation: Uses Zod schemas to validate individual entity shapes
 *
 * @see ../schemas/snapshotEntities.js for entity schema definitions
 */

import {
  validateSnapshot,
  fullSnapshotSchema,
  looseSnapshotSchema,
} from "../schemas/snapshotEntities.js";

const ARRAY_KEYS = [
  "companies",
  "projects",
  "pages",
  "media",
  "leads",
  "templates",
  "teamMembers",
  "billingRecords",
  "seoEntries",
  "activity",
  "auditEvents",
  "notifications",
  "webhookLogs",
  "internalNotes",
];

/**
 * Validate admin portal snapshot data.
 *
 * @param {unknown} data - The snapshot data to validate
 * @param {{ deep?: boolean }} [options] - Validation options
 * @param {boolean} [options.deep=false] - If true, performs deep validation of
 *   individual entities using Zod schemas. If false (default), only checks
 *   that array fields are arrays (lightweight structural check).
 * @returns {{ ok: true } | { ok: false, error: string, issues?: import('zod').ZodIssue[] }}
 *
 * @example
 * // Light validation (default) - fast structural check
 * const result = validateAdminSnapshotData(data);
 *
 * @example
 * // Deep validation - validates each entity against its schema
 * const result = validateAdminSnapshotData(data, { deep: true });
 * if (!result.ok) {
 *   console.log(result.error);   // Human-readable error
 *   console.log(result.issues);  // Full Zod validation issues
 * }
 */
export function validateAdminSnapshotData(data, options = {}) {
  const { deep = false } = options;

  // Basic type check
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "Snapshot data must be a plain object" };
  }

  // Deep validation: use Zod schemas for full entity validation
  if (deep) {
    return validateSnapshot(data, { deep: true });
  }

  // Light validation: structural checks only (backward-compatible)
  /** @type {Record<string, unknown>} */
  const obj = data;

  for (const key of ARRAY_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const v = obj[key];
    if (v != null && !Array.isArray(v)) {
      return { ok: false, error: `Field "${key}" must be an array when present` };
    }
  }

  if (obj.platformSettings != null && typeof obj.platformSettings !== "object") {
    return { ok: false, error: "platformSettings must be an object when present" };
  }

  return { ok: true };
}

/**
 * Validate and parse snapshot data with deep entity validation.
 * Returns the parsed data on success (with defaults applied).
 *
 * @param {unknown} data
 * @returns {{ ok: true, data: import('../schemas/snapshotEntities.js').FullSnapshot } | { ok: false, error: string, issues?: import('zod').ZodIssue[] }}
 */
export function parseAdminSnapshotData(data) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "Snapshot data must be a plain object" };
  }

  const result = fullSnapshotSchema.safeParse(data);

  if (result.success) {
    return { ok: true, data: result.data };
  }

  const firstIssue = result.error.issues[0];
  const path = firstIssue?.path?.join(".") || "";
  const message = firstIssue?.message || "Validation failed";

  return {
    ok: false,
    error: path ? `${path}: ${message}` : message,
    issues: result.error.issues,
  };
}

// Re-export schemas for convenience
export { fullSnapshotSchema, looseSnapshotSchema } from "../schemas/snapshotEntities.js";

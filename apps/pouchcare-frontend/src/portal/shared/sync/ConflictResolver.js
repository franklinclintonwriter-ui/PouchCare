/**
 * ConflictResolver — Last-write-wins conflict resolution utilities.
 *
 * Provides deterministic merge logic for records that may have been
 * modified concurrently across tabs or between the client and server.
 *
 * @module ConflictResolver
 */

/** Unix epoch as an ISO string — used when `updatedAt` is missing. */
const EPOCH_ISO = "1970-01-01T00:00:00.000Z";

/**
 * @typedef {Object} SyncRecord
 * @property {string | number} id
 * @property {string}          [updatedAt] - ISO-8601 timestamp of last update.
 */

/**
 * Normalise an `updatedAt` value to a numeric timestamp (ms since epoch).
 *
 * - If the value is already a number it is returned as-is.
 * - Strings are parsed via `Date.parse`.
 * - Missing / falsy values default to `0` (epoch).
 *
 * @param {string | number | null | undefined} value
 * @returns {number}
 */
function toTimestamp(value) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Resolve a conflict between two versions of the same record using a
 * **last-write-wins** strategy.
 *
 * Rules:
 * 1. If one side is `null` (deleted) and the other is not, the deletion
 *    wins **only** when its `updatedAt` is newer.
 * 2. Otherwise the record with the more recent `updatedAt` wins.
 * 3. When timestamps are equal the `remote` record is preferred (server
 *    is treated as the source of truth).
 * 4. Missing `updatedAt` defaults to epoch (1970-01-01T00:00:00Z).
 *
 * @param {SyncRecord | null} local  - The local version of the record.
 * @param {SyncRecord | null} remote - The remote (or other-tab) version.
 * @returns {SyncRecord | null} The winning record.
 *
 * @example
 * const winner = resolveConflict(
 *   { id: 1, name: "Draft",     updatedAt: "2025-06-01T10:00:00Z" },
 *   { id: 1, name: "Published", updatedAt: "2025-06-01T12:00:00Z" },
 * );
 * // => remote wins (more recent updatedAt)
 */
export function resolveConflict(local, remote) {
  // Both null → nothing to resolve.
  if (local == null && remote == null) return null;

  // Only one side exists — the existing side wins if deletion is older.
  if (local == null) return remote;
  if (remote == null) {
    // remote is a deletion — if remote's deletion timestamp were newer we'd
    // keep null, but since null carries no updatedAt we treat local as winner.
    return local;
  }

  const localTs = toTimestamp(local.updatedAt);
  const remoteTs = toTimestamp(remote.updatedAt);

  // Prefer remote on tie (server = source of truth).
  return remoteTs >= localTs ? remote : local;
}

/**
 * Resolve a conflict where one or both sides may represent a deletion.
 *
 * A deletion is modelled as `{ id, updatedAt, _deleted: true }` **or**
 * simply `null`.  When `null`, an optional `deletedAt` timestamp can be
 * supplied separately so the caller can indicate *when* the deletion
 * occurred.
 *
 * @param {SyncRecord | null} local
 * @param {SyncRecord | null} remote
 * @param {{ localDeletedAt?: string | number, remoteDeletedAt?: string | number }} [meta]
 * @returns {SyncRecord | null}
 */
export function resolveConflictWithDeletion(local, remote, meta = {}) {
  const localIsDeleted = local == null || /** @type {*} */ (local)._deleted;
  const remoteIsDeleted = remote == null || /** @type {*} */ (remote)._deleted;

  // Neither deleted — normal LWW.
  if (!localIsDeleted && !remoteIsDeleted) {
    return resolveConflict(local, remote);
  }

  // Both deleted → keep null.
  if (localIsDeleted && remoteIsDeleted) return null;

  // One side deleted — compare deletion timestamp against the surviving
  // record's updatedAt.
  if (localIsDeleted) {
    const deleteTs = toTimestamp(
      local ? /** @type {*} */ (local).updatedAt : meta.localDeletedAt
    );
    const remoteTs = toTimestamp(remote ? remote.updatedAt : undefined);
    return deleteTs >= remoteTs ? null : remote;
  }

  // remote is the deleted side
  const deleteTs = toTimestamp(
    remote ? /** @type {*} */ (remote).updatedAt : meta.remoteDeletedAt
  );
  const localTs = toTimestamp(local ? local.updatedAt : undefined);
  return deleteTs >= localTs ? null : local;
}

/**
 * Merge two snapshots (keyed collections of record arrays) into one.
 *
 * Each snapshot is an object whose keys are collection names (e.g.
 * `"projects"`, `"leads"`) and values are arrays of records that each
 * carry an `id` and an `updatedAt`.
 *
 * For every collection present in either snapshot the function:
 * 1. Indexes records by `id`.
 * 2. Calls {@link resolveConflict} for every id that appears in both sets.
 * 3. Keeps records that appear only on one side as-is.
 * 4. Filters out `null` results (deleted records).
 *
 * @param {Record<string, SyncRecord[]>} localSnapshot
 * @param {Record<string, SyncRecord[]>} remoteSnapshot
 * @returns {Record<string, SyncRecord[]>} Merged snapshot.
 *
 * @example
 * const merged = mergeSnapshots(
 *   { projects: [{ id: 1, name: "A", updatedAt: "2025-06-01T10:00:00Z" }] },
 *   { projects: [{ id: 1, name: "B", updatedAt: "2025-06-01T12:00:00Z" }] },
 * );
 * // merged.projects => [{ id: 1, name: "B", updatedAt: "2025-06-01T12:00:00Z" }]
 */
export function mergeSnapshots(localSnapshot, remoteSnapshot) {
  const allKeys = new Set([
    ...Object.keys(localSnapshot ?? {}),
    ...Object.keys(remoteSnapshot ?? {}),
  ]);

  /** @type {Record<string, SyncRecord[]>} */
  const result = {};

  for (const key of allKeys) {
    const localRecords = localSnapshot?.[key] ?? [];
    const remoteRecords = remoteSnapshot?.[key] ?? [];

    /** @type {Map<string | number, SyncRecord>} */
    const localMap = new Map();
    for (const r of localRecords) {
      if (r && r.id != null) localMap.set(r.id, r);
    }

    /** @type {Map<string | number, SyncRecord>} */
    const remoteMap = new Map();
    for (const r of remoteRecords) {
      if (r && r.id != null) remoteMap.set(r.id, r);
    }

    const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

    /** @type {SyncRecord[]} */
    const merged = [];

    for (const id of allIds) {
      const local = localMap.get(id) ?? null;
      const remote = remoteMap.get(id) ?? null;

      const winner = resolveConflict(local, remote);
      if (winner != null) {
        merged.push(winner);
      }
    }

    result[key] = merged;
  }

  return result;
}

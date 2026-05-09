/**
 * Sync utilities — barrel export.
 *
 * @module sync
 */

export { createBroadcastSync } from "./BroadcastSync.js";
// ServerSync is available but not barrel-exported (no SSE backend yet)
export {
  resolveConflict,
  resolveConflictWithDeletion,
  mergeSnapshots,
} from "./ConflictResolver.js";

/**
 * Shared utility functions.
 * Re-exports everything from the utils sub-modules.
 */
export { withUpdated } from "./withUpdated.js";
export { nowLabel } from "./nowLabel.js";
export { createId } from "./createId.js";
export {
  createActivityEntry,
  createAuditEntry,
  pushToList,
  ACTIVITY_CAP,
  AUDIT_CAP,
  NOTIFICATION_CAP,
} from "./activityHelpers.js";

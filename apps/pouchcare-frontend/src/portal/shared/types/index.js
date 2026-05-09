/**
 * Shared type definitions and constants.
 * Re-exports everything from the types sub-modules.
 */
export { UserRoles, PortalType } from "./user.js";

// entities.js is pure JSDoc -- nothing to re-export at runtime,
// but consumers can reference the typedefs via:
//   /** @type {import("../shared/types/entities.js").Company} */

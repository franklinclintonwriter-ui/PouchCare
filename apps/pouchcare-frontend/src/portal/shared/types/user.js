/**
 * Unified user role constants for both admin and customer portals.
 * These replace scattered string literals across the codebase.
 */
export const UserRoles = {
  OWNER: "owner",
  ADMIN: "admin",
  SUPPORT: "support",
  FINANCE: "finance",
  EDITOR: "editor",
  CUSTOMER: "customer",
};

/**
 * Portal type identifiers used for routing and context switching.
 */
export const PortalType = {
  ADMIN: "admin",
  CUSTOMER: "customer",
};

/**
 * Unified user shape used across both portals.
 *
 * @typedef {Object} User
 * @property {string} id           - Unique user identifier
 * @property {string} name         - Display name
 * @property {string} email        - Email address
 * @property {string} role         - One of UserRoles values
 * @property {string} org          - Organization / company the user belongs to
 * @property {string} plan         - Current subscription plan
 * @property {string} status       - Account status (e.g. "Active", "Suspended")
 * @property {string} portal       - One of PortalType values indicating portal affinity
 * @property {string[]} permissions - Granular permission strings for access control
 */

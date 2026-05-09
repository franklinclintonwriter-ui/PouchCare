import { UserRoles } from "../types/user.js";

/**
 * All granular permission action keys used across the platform.
 * @readonly
 * @enum {string}
 */
export const Permissions = {
  MANAGE_COMPANIES: "manage_companies",
  MANAGE_TEAM: "manage_team",
  MANAGE_BILLING: "manage_billing",
  MANAGE_TEMPLATES: "manage_templates",
  MANAGE_PAGES: "manage_pages",
  MANAGE_MEDIA: "manage_media",
  MANAGE_SEO: "manage_seo",
  MANAGE_LEADS: "manage_leads",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_PROJECTS: "manage_projects",
  VIEW_ANALYTICS: "view_analytics",
  VIEW_SYSTEM_STATUS: "view_system_status",
  MANAGE_MARKETPLACE: "manage_marketplace",
  MANAGE_WEBSITES: "manage_websites",
  MANAGE_SUBSCRIPTIONS: "manage_subscriptions",
  MANAGE_PLUGINS: "manage_plugins",
  MANAGE_TICKETS: "manage_tickets",
  MANAGE_API_KEYS: "manage_api_keys",
  MANAGE_PROFILE: "manage_profile",
  VIEW_DASHBOARD: "view_dashboard",
};

/** @type {string[]} All permission values */
const ALL_PERMISSIONS = Object.values(Permissions);

/** @type {string[]} All permissions except MANAGE_SETTINGS */
const ADMIN_PERMISSIONS = ALL_PERMISSIONS.filter(
  (p) => p !== Permissions.MANAGE_SETTINGS
);

/**
 * Maps each role to its allowed permission set.
 * @type {Record<string, string[]>}
 */
export const ROLE_PERMISSIONS = {
  [UserRoles.OWNER]: ALL_PERMISSIONS,

  [UserRoles.ADMIN]: ADMIN_PERMISSIONS,

  [UserRoles.SUPPORT]: [
    Permissions.VIEW_DASHBOARD,
    Permissions.MANAGE_TICKETS,
    Permissions.MANAGE_LEADS,
  ],

  [UserRoles.FINANCE]: [
    Permissions.VIEW_DASHBOARD,
    Permissions.MANAGE_BILLING,
    Permissions.VIEW_ANALYTICS,
  ],

  [UserRoles.EDITOR]: [
    Permissions.MANAGE_TEMPLATES,
    Permissions.MANAGE_PAGES,
    Permissions.MANAGE_MEDIA,
    Permissions.MANAGE_SEO,
    Permissions.VIEW_DASHBOARD,
  ],

  [UserRoles.CUSTOMER]: [
    Permissions.MANAGE_WEBSITES,
    Permissions.MANAGE_SUBSCRIPTIONS,
    Permissions.MANAGE_PLUGINS,
    Permissions.MANAGE_TICKETS,
    Permissions.MANAGE_API_KEYS,
    Permissions.MANAGE_PROFILE,
    Permissions.VIEW_DASHBOARD,
  ],
};

/**
 * Check whether a role has a specific permission.
 *
 * @param {string} role  - One of the UserRoles values
 * @param {string} permission - One of the Permissions values
 * @returns {boolean} True if the role grants the given permission
 */
export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

/**
 * Return all permissions granted to a role.
 *
 * @param {string} role - One of the UserRoles values
 * @returns {string[]} Array of permission strings (empty if role is unknown)
 */
export function getPermissions(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}

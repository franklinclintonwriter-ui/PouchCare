/** Must match `PERMISSION_KEYS` in apps/api/src/lib/managementPermissions.ts */
export const PERMISSION_KEYS = [
  'staff.branches',
  'staff.manage_profiles',
  'payroll.access',
  'finance.access',
  'finance.exchange_rates',
  'crm.client_accounts',
  'hr.recruitment',
  'hr.performance',
  'assets.devices',
  'monitor.view',
  'broadcast.access',
  'analytics.access',
  'admin_portal.access',
  'settings.role_permissions',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

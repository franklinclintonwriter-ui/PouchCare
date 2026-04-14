import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { PERMISSION_KEYS, type PermissionKey } from '@/constants/permissionKeys';
import { ROLE_LABELS } from '@/utils/permissions';
import type { SystemRole } from '@/types/enums';

const KEY_LABELS: Record<PermissionKey, string> = {
  'staff.branches': 'Branches',
  'staff.manage_profiles': 'Staff profiles (view/edit)',
  'payroll.access': 'Payroll',
  'finance.access': 'Finance',
  'finance.exchange_rates': 'Exchange rates',
  'crm.client_accounts': 'CRM client accounts',
  'hr.recruitment': 'HR recruitment',
  'hr.performance': 'Performance reviews',
  'assets.devices': 'Device inventory',
  'monitor.view': 'CCTV / Monitor',
  'broadcast.access': 'Broadcasts',
  'analytics.access': 'Analytics',
  'admin_portal.access': 'Portal admin',
  'settings.role_permissions': 'Role permissions matrix',
};

export function StaffRolePermissionsPanel({
  memberRole,
  rolePermissions,
  canEditMatrix,
}: {
  memberRole: SystemRole;
  rolePermissions: Record<string, boolean> | null | undefined;
  canEditMatrix: boolean;
}) {
  const perms = rolePermissions ?? {};

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary-600" />
              Effective permissions
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Defaults for role <span className="font-medium text-gray-700 dark:text-gray-200">{ROLE_LABELS[memberRole]}</span>
              {' '}— same for everyone with this role. Per-user overrides are not stored; change role or matrix defaults.
            </p>
          </div>
          {canEditMatrix ? (
            <Link
              to="/settings/role-permissions"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Edit role matrix
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {PERMISSION_KEYS.map((key) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-700/60"
          >
            <span className="text-sm text-gray-700 dark:text-gray-200">{KEY_LABELS[key]}</span>
            <Toggle checked={perms[key] === true} disabled onChange={() => {}} size="sm" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

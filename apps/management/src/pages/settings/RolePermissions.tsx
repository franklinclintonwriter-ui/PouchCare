import { useMemo, useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { useRolePermissionsMatrix, useUpdateRolePermissions } from '@/api/role-permissions';
import { PERMISSION_KEYS, PERMISSION_LABELS, type PermissionKey } from '@/constants/permissionKeys';
import { ROLE_LABELS } from '@/utils/permissions';
import type { SystemRole } from '@/types/enums';
import { toast } from 'sonner';

const ROLE_ORDER: SystemRole[] = [
  'CEO',
  'CO_MD',
  'OP_MANAGER',
  'HR_MANAGER',
  'BRANCH_MANAGER',
  'STAFF',
  'INTERN',
];

export default function RolePermissions() {
  const { data, isLoading, error } = useRolePermissionsMatrix();
  const updateMutation = useUpdateRolePermissions();
  const [local, setLocal] = useState<Record<string, Record<string, boolean>> | null>(null);

  useEffect(() => {
    if (data?.matrix) setLocal(JSON.parse(JSON.stringify(data.matrix)));
  }, [data?.matrix]);

  const headerConfig = useMemo(
    () => ({
      title: 'Role permissions',
      breadcrumbs: [
        { label: 'Settings', href: '/settings/profile' },
        { label: 'Role permissions', icon: Shield },
      ],
      actions: [],
    }),
    [],
  );

  useHeaderConfig(headerConfig);

  const dirty = useMemo(() => {
    if (!data?.matrix || !local) return false;
    for (const role of ROLE_ORDER) {
      for (const key of PERMISSION_KEYS) {
        if (data.matrix[role]?.[key] !== local[role]?.[key]) return true;
      }
    }
    return false;
  }, [data, local]);

  const save = () => {
    if (!data?.matrix || !local) return;
    const updates: { role: SystemRole; key: PermissionKey; allowed: boolean }[] = [];
    for (const role of ROLE_ORDER) {
      for (const key of PERMISSION_KEYS) {
        const before = data.matrix[role]?.[key];
        const after = local[role]?.[key];
        if (before !== after) {
          updates.push({ role, key, allowed: !!after });
        }
      }
    }
    if (updates.length === 0) {
      toast.message('No changes to save');
      return;
    }
    updateMutation.mutate(updates, {
      onSuccess: () => toast.success('Permissions updated'),
      onError: () => toast.error('Failed to update permissions'),
    });
  };

  if (error) {
    return (
      <PageTransition className="p-6">
        <p className="text-sm text-red-600">Could not load permissions. You may need CEO or Co-MD access.</p>
      </PageTransition>
    );
  }

  if (isLoading || !local) {
    return (
      <PageTransition className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="mx-auto max-w-6xl space-y-4">
      <Card data-testid="role-permissions-card">
        <CardHeader>
          <CardTitle>Management role access</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Defaults follow each role&apos;s typical scope. CEO and Co-MD can override what each role may access in
            the staff app. Changes apply on next API request (refresh the page if something looks stale).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 sm:hidden">
            {PERMISSION_KEYS.map((key) => (
              <div
                key={`mobile-${key}`}
                className="rounded-xl border border-gray-200/80 bg-white p-3 dark:border-gray-700/60 dark:bg-gray-800/80"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {PERMISSION_LABELS[key]}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {ROLE_ORDER.map((role) => (
                    <div
                      key={`mobile-${role}-${key}`}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-2 dark:bg-gray-800"
                    >
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {ROLE_LABELS[role]}
                      </span>
                      <Toggle
                        checked={!!local[role]?.[key]}
                        onChange={(v) =>
                          setLocal((prev) => {
                            if (!prev) return prev;
                            return { ...prev, [role]: { ...prev[role], [key]: v } };
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <div className="min-w-[720px]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4 text-left font-medium text-gray-600 dark:text-gray-300">Area</th>
                  {ROLE_ORDER.map((role) => (
                    <th key={role} className="px-1 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                      {ROLE_LABELS[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_KEYS.map((key) => (
                  <tr key={key} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">{PERMISSION_LABELS[key]}</td>
                    {ROLE_ORDER.map((role) => (
                      <td key={`${role}-${key}`} className="px-1 py-1 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            checked={!!local[role]?.[key]}
                            onChange={(v) =>
                              setLocal((prev) => {
                                if (!prev) return prev;
                                const next = { ...prev, [role]: { ...prev[role], [key]: v } };
                                return next;
                              })
                            }
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="primary"
              onClick={save}
              disabled={!dirty || updateMutation.isPending}
              data-testid="save-role-permissions"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}

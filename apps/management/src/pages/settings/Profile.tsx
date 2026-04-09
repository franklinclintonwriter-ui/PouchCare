import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCircle, Shield } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useAuthStore } from '@/store/authStore';
import { usePermission } from '@/hooks/usePermission';
import { useUpdateStaffProfile } from '@/api/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PageTransition } from '@/components/ui/PageTransition';
import { toast } from 'sonner';

export default function Profile() {
  const perm = usePermission();
  const user = useAuthStore((s) => s.user) as { name?: string; email?: string; phone?: string };
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const email = user?.email ?? '';
  const updateProfile = useUpdateStaffProfile();

  const headerConfig = useMemo(() => ({
    title: 'Profile',
    breadcrumbs: [
      { label: 'Settings', href: '/settings' },
      { label: 'Profile', icon: UserCircle },
    ],
    actions: [],
  }), []);
  useHeaderConfig(headerConfig);

  return (
    <PageTransition className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar name={name} size="xl" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            value={email}
            disabled
            hint="Contact admin to change email"
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              isLoading={updateProfile.isPending}
              onClick={async () => {
                try {
                  await updateProfile.mutateAsync({ name, phone, whatsapp: phone });
                  useAuthStore.getState().updateUser({ name, phone });
                  toast.success('Profile updated');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to update');
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {perm.can('settings.role_permissions') && (
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              to="/settings/role-permissions"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800/60"
              data-testid="link-role-permissions"
            >
              <Shield className="h-4 w-4 text-primary-600" />
              Role permissions
            </Link>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Configure which management areas each staff role can access.
            </p>
          </CardContent>
        </Card>
      )}
    </PageTransition>
  );
}

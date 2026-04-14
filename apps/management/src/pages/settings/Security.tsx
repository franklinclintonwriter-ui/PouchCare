import { useMemo, useState } from 'react';
import { Shield } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useChangeStaffPassword, useSetup2FA, useVerify2FA, useStaffMe } from '@/api/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageTransition } from '@/components/ui/PageTransition';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

export default function Security() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const { data: me, isLoading: meLoading } = useStaffMe();
  const changePassword = useChangeStaffPassword();
  const setup2FA = useSetup2FA();
  const verify2FA = useVerify2FA();

  const headerConfig = useMemo(() => ({
    title: 'Security',
    breadcrumbs: [
      { label: 'Settings', href: '/settings' },
      { label: 'Security', icon: Shield },
    ],
    actions: [],
  }), []);
  useHeaderConfig(headerConfig);

  return (
    <PageTransition className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              isLoading={changePassword.isPending}
              onClick={async () => {
                if (!currentPassword || !newPassword || !confirmPassword) {
                  toast.error('All password fields are required');
                  return;
                }
                if (newPassword !== confirmPassword) {
                  toast.error('New password and confirm password do not match');
                  return;
                }
                if (newPassword.length < 8) {
                  toast.error('New password must be at least 8 characters');
                  return;
                }
                try {
                  await changePassword.mutateAsync({ currentPassword, newPassword });
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  toast.success('Password updated');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to update password');
                }
              }}
            >
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Add an extra layer of security to your account
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                After verification, you may be asked for a code at sign-in (depending on role policy).
              </p>
            </div>
            {meLoading ? (
              <Skeleton className="h-7 w-24 rounded-full" />
            ) : me?.twoFactorEnabled ? (
              <Badge variant="success">2FA enabled</Badge>
            ) : me?.twoFactorPending ? (
              <Badge variant="warning">Verification pending</Badge>
            ) : (
              <Badge variant="default">2FA off</Badge>
            )}
          </div>
          {me?.twoFactorPending && (
            <p className="mt-2 text-xs text-amber-800 dark:text-amber-200/90">
              Authenticator secret was created—enter the 6-digit code from your app and click Verify to finish.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              isLoading={setup2FA.isPending}
              onClick={async () => {
                if (!currentPassword) {
                  toast.error('Current password is required to set up 2FA');
                  return;
                }
                try {
                  await setup2FA.mutateAsync(currentPassword);
                  toast.success('2FA setup initialized. Check authenticator app then verify code.');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : '2FA setup failed');
                }
              }}
            >
              Setup 2FA
            </Button>
            <Input
              placeholder="Enter 6-digit code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              className="max-w-[180px]"
            />
            <Button
              size="sm"
              isLoading={verify2FA.isPending}
              onClick={async () => {
                try {
                  await verify2FA.mutateAsync(twoFactorCode);
                  toast.success('2FA verified');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Invalid verification code');
                }
              }}
            >
              Verify
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Per-device session listing and remote revoke are not available yet. Use <strong>Log out</strong> in the sidebar to end this browser session.
          </p>
        </CardContent>
      </Card>
    </PageTransition>
  );
}

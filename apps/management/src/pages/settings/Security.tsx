import { useMemo, useState } from 'react';
import { Shield, Monitor, Smartphone, Globe } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useChangeStaffPassword, useSetup2FA, useVerify2FA } from '@/api/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import { PageTransition } from '@/components/ui/PageTransition';
import { toast } from 'sonner';

const sessions = [
  { id: '1', device: 'Chrome on Windows', icon: <Monitor className="h-4 w-4" />, ip: '192.168.1.42', lastActive: '2 minutes ago', current: true },
  { id: '2', device: 'Safari on iPhone', icon: <Smartphone className="h-4 w-4" />, ip: '10.0.0.15', lastActive: '1 hour ago', current: false },
  { id: '3', device: 'Firefox on MacOS', icon: <Globe className="h-4 w-4" />, ip: '172.16.0.8', lastActive: '3 days ago', current: false },
];

export default function Security() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Add an extra layer of security to your account
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                You will be asked for a verification code when signing in.
              </p>
            </div>
            <Toggle checked={twoFactor} onChange={setTwoFactor} />
          </div>
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
        <CardContent className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  {session.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {session.device}
                    </p>
                    {session.current && <Badge variant="success" size="sm">Current</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.ip} &middot; {session.lastActive}
                  </p>
                </div>
              </div>
              {!session.current && (
                <Button variant="ghost" size="sm">Revoke</Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </PageTransition>
  );
}

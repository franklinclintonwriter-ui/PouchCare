import { useState } from 'react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useAuthStore } from '@/store/authStore';
import { useUpdatePortalProfile } from '@/api/portal';
import { useChangePortalPassword } from '@/api/auth';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { PortalUser } from '@/types/auth';
import { toast } from 'sonner';

export default function PortalSettings() {
  const { user } = useAuthStore();
  const portalUser = user as PortalUser;
  const updateProfile = useUpdatePortalProfile();
  const changePassword = useChangePortalPassword();

  useHeaderConfig({
    title: 'Settings',
    breadcrumbs: [
      { label: 'Dashboard', href: '/portal' },
      { label: 'Settings' },
    ],
  });

  const [fullName, setFullName] = useState(portalUser?.fullName ?? '');
  const [phone, setPhone] = useState(portalUser?.phone ?? '');
  const [country, setCountry] = useState(portalUser?.country ?? '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <PageTransition>
      <div className="space-y-5 max-w-2xl">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                label="Email"
                value={portalUser?.email ?? ''}
                disabled
                hint="Email cannot be changed"
              />
              <Input
                label="Phone"
                placeholder="+1 234 567 890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Country"
                placeholder="United States"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                isLoading={updateProfile.isPending}
                onClick={async () => {
                  try {
                    await updateProfile.mutateAsync({
                      fullName,
                      phone,
                      whatsapp: phone,
                      country,
                    });
                    useAuthStore.getState().updateUser({ fullName, phone, country });
                    toast.success('Profile updated');
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Update failed');
                  }
                }}
              >
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
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
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

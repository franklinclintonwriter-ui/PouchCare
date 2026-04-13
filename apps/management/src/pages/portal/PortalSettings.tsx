import { useState } from 'react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useAuthStore } from '@/store/authStore';
import { useDeletePortalAvatar, useUpdatePortalProfile, useUploadPortalAvatar } from '@/api/portal';
import { useChangePortalPassword } from '@/api/auth';
import { PageTransition } from '@/components/ui/PageTransition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarUploadDialog } from '@/components/shared/AvatarUploadDialog';
import type { PortalUser } from '@/types/auth';
import { Camera, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PortalSettings() {
  const { user } = useAuthStore();
  const portalUser = user as PortalUser;
  const updateProfile = useUpdatePortalProfile();
  const uploadAvatar = useUploadPortalAvatar();
  const deleteAvatar = useDeletePortalAvatar();
  const changePassword = useChangePortalPassword();
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

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
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar
                name={portalUser?.fullName}
                src={portalUser?.avatarUrl}
                size="xl"
                className="!h-24 !w-24 text-2xl ring-2 ring-gray-100 dark:ring-gray-700"
              />
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={uploadAvatar.isPending || deleteAvatar.isPending}
                    onClick={() => setAvatarDialogOpen(true)}
                  >
                    <Camera className="mr-1.5 h-4 w-4" />
                    Upload photo
                  </Button>
                  {portalUser?.avatarUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                      disabled={uploadAvatar.isPending || deleteAvatar.isPending}
                      onClick={async () => {
                        try {
                          await deleteAvatar.mutateAsync();
                          toast.success('Photo removed');
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Remove failed');
                        }
                      }}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Remove photo
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPEG, PNG, or WebP are optimized to 512×512. GIF up to 1MB. Max 5MB.
                </p>
              </div>
            </div>
            <AvatarUploadDialog
              isOpen={avatarDialogOpen}
              onClose={() => setAvatarDialogOpen(false)}
              name={portalUser?.fullName}
              currentAvatarUrl={portalUser?.avatarUrl}
              isLoading={uploadAvatar.isPending}
              title="Update your portal photo"
              description="Preview the image before uploading it to your portal profile."
              onConfirm={async (file) => {
                await uploadAvatar.mutateAsync(file);
                toast.success('Profile photo updated');
              }}
            />
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

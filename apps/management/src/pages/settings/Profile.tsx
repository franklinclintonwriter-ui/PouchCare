import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCircle, Shield, Camera, Trash2 } from 'lucide-react';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { useAuthStore } from '@/store/authStore';
import { usePermission } from '@/hooks/usePermission';
import {
  useUpdateStaffProfile,
  useStaffMe,
  useUploadStaffAvatar,
  useDeleteStaffAvatar,
} from '@/api/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PageTransition } from '@/components/ui/PageTransition';
import { AvatarUploadDialog } from '@/components/shared/AvatarUploadDialog';
import { toast } from 'sonner';

export default function Profile() {
  const perm = usePermission();
  const storeUser = useAuthStore((s) => s.user) as {
    name?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  };
  const { data: me, isLoading: meLoading } = useStaffMe();
  const [name, setName] = useState(storeUser?.name ?? '');
  const [phone, setPhone] = useState(storeUser?.phone ?? '');
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const updateProfile = useUpdateStaffProfile();
  const uploadAvatar = useUploadStaffAvatar();
  const deleteAvatar = useDeleteStaffAvatar();

  const email = me?.email ?? storeUser?.email ?? '';
  const avatarUrl = me?.avatarUrl ?? storeUser?.avatarUrl;
  const displayName = me?.name ?? name;

  useEffect(() => {
    if (me) {
      setName(me.name ?? '');
      setPhone(me.phone ?? '');
    }
  }, [me]);

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
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <Avatar
              name={displayName}
              src={avatarUrl}
              size="xl"
              className="!h-24 !w-24 text-2xl ring-2 ring-gray-100 dark:ring-gray-700"
            />
            {(uploadAvatar.isPending || deleteAvatar.isPending || meLoading) && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadAvatar.isPending || deleteAvatar.isPending}
                onClick={() => setAvatarDialogOpen(true)}
              >
                <Camera className="mr-1.5 h-4 w-4" />
                Upload photo
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                  disabled={uploadAvatar.isPending || deleteAvatar.isPending}
                  onClick={async () => {
                    try {
                      await deleteAvatar.mutateAsync();
                      toast.success('Photo removed');
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Failed to remove');
                    }
                  }}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              JPEG, PNG, or WebP (optimized to 512×512). GIF up to 1MB. Max 5MB.
            </p>
          </div>
        </CardContent>
      </Card>
      <AvatarUploadDialog
        isOpen={avatarDialogOpen}
        onClose={() => setAvatarDialogOpen(false)}
        name={displayName}
        currentAvatarUrl={avatarUrl}
        isLoading={uploadAvatar.isPending}
        title="Update your photo"
        description="Preview the image before uploading it to your staff profile."
        onConfirm={async (file) => {
          await uploadAvatar.mutateAsync(file);
          toast.success('Profile photo updated');
        }}
      />

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

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/authStore'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function SettingsPage() {
  const { user } = useAuthStore()
  usePageHeader('⚙️ Settings')
  return (
    <div>
      <div className="max-w-2xl space-y-6">
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-6">
          <h3 className="font-sora font-semibold mb-4">Profile</h3>
          <div className="space-y-4">
            <Input label="Full Name" defaultValue={user?.name} />
            <Input label="Email" type="email" defaultValue={user?.email} />
            <Input label="Role" defaultValue={user?.role} disabled />
          </div>
          <Button className="mt-4">Save Changes</Button>
        </div>
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-6">
          <h3 className="font-sora font-semibold mb-4">Security</h3>
          <div className="space-y-4">
            <Input label="Current Password" type="password" placeholder="••••••••" />
            <Input label="New Password" type="password" placeholder="••••••••" />
          </div>
          <Button className="mt-4" variant="ghost">Update Password</Button>
        </div>
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-6">
          <h3 className="font-sora font-semibold mb-2">Two-Factor Authentication</h3>
          <p className="text-sm text-text-muted mb-4">Required for CEO and Co-MD roles.</p>
          <Button variant="secondary">Setup 2FA</Button>
        </div>
      </div>
    </div>
  )
}

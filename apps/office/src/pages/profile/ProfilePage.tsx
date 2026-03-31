import { useAuthStore } from '@/stores/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useNavigate } from 'react-router-dom'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  usePageHeader('👤 My Profile')

  return (
    <div>
      <div className="max-w-xl space-y-4">
        {/* Avatar */}
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-sky-500/20 border-2 border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-2xl font-sora flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div>
            <p className="font-sora font-bold text-lg">{user?.name}</p>
            <p className="text-sm text-text-muted">{user?.email}</p>
            <div className="mt-1.5">
              <Badge label={user?.role || 'Staff'} color="sky" />
              {user?.branch && <span className="ml-2 text-xs text-text-muted">{user.branch}</span>}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-6 space-y-4">
          <h3 className="font-sora font-semibold mb-1">Edit Profile</h3>
          <Input label="Full Name" defaultValue={user?.name} />
          <Input label="Email" type="email" defaultValue={user?.email} disabled />
          <Input label="WhatsApp" type="tel" placeholder="+880..." />
          <Button className="w-full">Save Changes</Button>
        </div>

        {/* Password */}
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-6 space-y-4">
          <h3 className="font-sora font-semibold mb-1">Change Password</h3>
          <Input label="Current Password" type="password" placeholder="••••••••" />
          <Input label="New Password" type="password" placeholder="••••••••" />
          <Button variant="ghost" className="w-full">Update Password</Button>
        </div>

        {/* Sign out */}
        <button onClick={() => { logout(); navigate('/login') }}
          className="w-full text-sm text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-xl p-3 transition-all">
          Sign Out
        </button>
      </div>
    </div>
  )
}

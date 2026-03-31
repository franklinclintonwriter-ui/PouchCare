import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { usePageHeader } from '@/hooks/usePageHeader'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const toast = useToast()
  const { data: me } = useQuery({ queryKey: ['portal-me'], queryFn: () => api.get('/portal/me').then(r => r.data.data) })
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ values: { fullName: me?.fullName, phone: me?.phone, country: me?.country } })

  const onSave = async (d: any) => { try { await api.put('/portal/me', d); toast.success('Profile updated') } catch { toast.error('Failed') } }

  usePageHeader('👤 My Profile')

  return (
    <div>
      <div className="max-w-xl space-y-4">
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-sky-500/20 border-2 border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xl">{user?.fullName?.[0]?.toUpperCase() || 'C'}</div>
          <div className="flex-1 min-w-0">
            <p className="font-sora font-bold text-lg truncate">{me?.fullName}</p>
            <p className="text-sm text-text-muted truncate">{me?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge label={me?.status || 'ACTIVE'} color={me?.status === 'ACTIVE' ? 'green' : 'gray'} />
              {me?.emailVerified ? <Badge label="Verified" color="sky" dot={false} /> : <Badge label="Unverified" color="red" dot={false} />}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[['Orders', me?.totalOrders || 0], ['Referrals', me?.totalReferrals || 0], ['Joined', me?.registrationDate ? formatDate(me.registrationDate) : '—']].map(([l, v]) => (
            <div key={String(l)} className="bg-midnight-card border border-midnight-border rounded-xl p-3 text-center">
              <p className="font-mono font-bold text-text-primary">{String(v)}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{l}</p>
            </div>
          ))}
        </div>
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-5">
          <h3 className="font-sora font-semibold mb-4">Edit Profile</h3>
          <form onSubmit={handleSubmit(onSave)} className="space-y-3">
            <Input label="Full Name" placeholder="John Smith" {...register('fullName')} />
            <Input label="Phone" type="tel" placeholder="+1 555 0100" {...register('phone')} />
            <Input label="Country" placeholder="United States" {...register('country')} />
            <Button type="submit" className="w-full" loading={isSubmitting}>Save Changes</Button>
          </form>
        </div>
        <div className="bg-midnight-card border border-midnight-border rounded-xl p-5">
          <h3 className="font-sora font-semibold mb-3">Your Referral Code</h3>
          <div className="bg-midnight border border-midnight-border rounded-lg p-4 flex items-center justify-between">
            <span className="font-mono font-bold text-sky-400 text-lg">{me?.referralCode}</span>
            <button onClick={() => { navigator.clipboard.writeText(`https://pouchcare.com.bd/register?ref=${me?.referralCode}`); toast.success('Copied!') }} className="text-xs text-sky-500 hover:underline">Copy Link</button>
          </div>
          <p className="text-xs text-text-muted mt-2">Earn 20% commission on every order from your referrals.</p>
        </div>
        <button onClick={() => { logout(); window.location.href = '/login' }} className="w-full text-sm text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-xl p-3 transition-all">Sign Out</button>
      </div>
    </div>
  )
}

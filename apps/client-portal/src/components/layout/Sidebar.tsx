import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'
const NAV = [
  { icon: '📊', label: 'Dashboard', to: '/' },
  { icon: '🛍️', label: 'Services', to: '/services' },
  { icon: '📦', label: 'My Orders', to: '/orders' },
  { icon: '💰', label: 'Wallet', to: '/wallet' },
  { icon: '🔗', label: 'Referrals', to: '/referrals' },
  { icon: '🎫', label: 'Support', to: '/support' },
  { icon: '👤', label: 'Profile', to: '/profile' },
]
export function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-56 flex flex-col bg-midnight-card border-r border-midnight-border">
      <div className="h-16 flex items-center border-b border-midnight-border px-4 gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">P</div>
        <div><span className="font-sora font-bold text-sm">Pouch<span className="text-sky-500">Care</span></span><p className="text-[10px] text-text-muted leading-none">Client Portal</p></div>
      </div>
      {user && (
        <div className="px-4 py-3 border-b border-midnight-border bg-sky-500/5">
          <p className="text-[10px] text-text-muted uppercase tracking-wide">Wallet Balance</p>
          <p className="font-mono font-bold text-lg text-sky-400">{formatCurrency(user.walletBalance)}</p>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-all ${isActive ? 'bg-sky-500/15 text-sky-500 font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}>
            <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
            <span className="font-inter truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-midnight-border p-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-500 text-xs font-bold">{user?.fullName?.[0]?.toUpperCase() || 'C'}</div>
          <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{user?.fullName}</p><p className="text-[10px] text-text-muted font-mono truncate">{user?.referralCode}</p></div>
        </div>
        <button onClick={() => { logout(); navigate('/login') }} className="text-xs text-text-muted hover:text-red-400 transition-colors w-full text-left">Sign out</button>
      </div>
    </aside>
  )
}

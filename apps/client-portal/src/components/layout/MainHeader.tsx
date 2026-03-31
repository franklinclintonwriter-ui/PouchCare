import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { formatCurrency } from '@/lib/utils'

export function MainHeader() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { pageTitle, pageSubtitle, pageActions } = useUiStore()

  return (
    <header className="fixed top-0 left-56 right-0 h-16 bg-midnight-card/95 backdrop-blur border-b border-midnight-border z-20 flex items-center gap-4 px-5">
      <div className="flex flex-col justify-center flex-shrink-0 min-w-0">
        <h1 className="font-sora font-semibold text-text-primary leading-tight truncate">
          {pageTitle || 'PouchCare'}
        </h1>
        {pageSubtitle && (
          <p className="text-[11px] text-text-muted leading-tight truncate">{pageSubtitle}</p>
        )}
      </div>

      <div className="flex-1" />

      {pageActions && <div className="flex items-center gap-2 flex-shrink-0">{pageActions}</div>}

      {/* Wallet balance badge */}
      {user && (
        <div className="hidden md:flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 rounded-lg px-3 py-1.5">
          <span className="text-[10px] text-text-muted">Balance</span>
          <span className="font-mono font-bold text-sm text-sky-400">{formatCurrency(user.walletBalance)}</span>
        </div>
      )}

      {/* Notifications */}
      <button className="relative text-text-muted hover:text-text-primary transition-colors p-2 rounded-lg hover:bg-white/5">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      {/* Avatar + quick logout */}
      <div className="relative group">
        <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-500 text-xs font-bold cursor-pointer hover:bg-sky-500/30 transition-colors">
          {user?.fullName?.[0]?.toUpperCase() || 'C'}
        </div>
        <div className="absolute right-0 top-10 hidden group-hover:block bg-midnight-card border border-midnight-border rounded-xl shadow-xl py-1 min-w-[160px] z-50">
          <p className="px-3 py-1.5 text-xs font-semibold text-text-primary truncate">{user?.fullName}</p>
          <p className="px-3 pb-1 text-[10px] text-text-muted font-mono truncate">{user?.referralCode}</p>
          <hr className="border-midnight-border my-1" />
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}

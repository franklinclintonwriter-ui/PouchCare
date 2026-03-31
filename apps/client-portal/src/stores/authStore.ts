import { create } from 'zustand'
import { persist } from 'zustand/middleware'
interface PortalUser { id: string; fullName: string; email: string; referralCode: string; walletBalance: number }
interface AuthStore { user: PortalUser | null; isAuthenticated: boolean; setAuth: (u: PortalUser, t: string, r: string) => void; updateBalance: (b: number) => void; logout: () => void }
export const useAuthStore = create<AuthStore>()(persist((set) => ({
  user: null, isAuthenticated: false,
  setAuth: (user, token, refresh) => { localStorage.setItem('access_token', token); localStorage.setItem('refresh_token', refresh); set({ user, isAuthenticated: true }) },
  updateBalance: (balance) => set(s => ({ user: s.user ? { ...s.user, walletBalance: balance } : null })),
  logout: () => { localStorage.clear(); set({ user: null, isAuthenticated: false }) },
}), { name: 'pouchcare-portal-auth', partialize: s => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }))

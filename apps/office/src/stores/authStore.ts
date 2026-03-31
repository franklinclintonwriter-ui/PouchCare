import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthStore {
  user: User | null; isAuthenticated: boolean
  setAuth: (user: User, token: string, refresh: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null, isAuthenticated: false,
      setAuth: (user, token, refresh) => {
        localStorage.setItem('access_token', token)
        localStorage.setItem('refresh_token', refresh)
        set({ user, isAuthenticated: true })
      },
      logout: () => {
        localStorage.clear()
        set({ user: null, isAuthenticated: false })
      },
    }),
    { name: 'pouchcare-office-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
)

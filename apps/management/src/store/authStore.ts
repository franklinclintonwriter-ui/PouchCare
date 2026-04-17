import { create } from 'zustand';
import type { StaffUser, PortalUser } from '@/types/auth';
import { getAccessToken, getRefreshToken, getUserType, setAccessToken, setRefreshToken, setUserType, clearAuth } from '@/utils/storage';

interface AuthState {
  user: StaffUser | PortalUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  userType: 'staff' | 'portal' | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: StaffUser | PortalUser, accessToken: string, refreshToken: string, userType: 'staff' | 'portal') => void;
  setUser: (user: StaffUser | PortalUser) => void;
  updateTokens: (accessToken: string, refreshToken?: string) => void;
  updateUser: (user: Partial<StaffUser> | Partial<PortalUser>) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: getAccessToken(),
  refreshToken: getRefreshToken(),
  userType: getUserType(),
  isAuthenticated: !!getAccessToken(),
  isLoading: true,

  setAuth: (user, accessToken, refreshToken, userType) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUserType(userType);
    set({ user, accessToken, refreshToken, userType, isAuthenticated: true, isLoading: false });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true });
  },

  updateTokens: (accessToken, refreshToken) => {
    setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);
    set((state) => ({
      accessToken,
      refreshToken: refreshToken ?? state.refreshToken,
    }));
  },

  updateUser: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : (updates as StaffUser | PortalUser),
    }));
  },

  logout: () => {
    clearAuth();
    set({ user: null, accessToken: null, refreshToken: null, userType: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));

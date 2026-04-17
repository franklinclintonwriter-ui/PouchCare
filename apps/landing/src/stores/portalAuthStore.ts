import { create } from "zustand";
import type { PortalUser } from "@/types/portalAuth";
import {
  clearPortalAuth,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/utils/portalStorage";

interface PortalAuthState {
  user: PortalUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (
    user: PortalUser,
    accessToken: string,
    refreshToken: string,
    remember?: boolean,
  ) => void;
  setUser: (user: PortalUser) => void;
  updateTokens: (accessToken: string) => void;
  logout: () => void;
}

export const usePortalAuthStore = create<PortalAuthState>((set) => ({
  user: null,
  accessToken: getAccessToken(),
  refreshToken: getRefreshToken(),
  isAuthenticated: !!getAccessToken(),

  setAuth: (user, accessToken, refreshToken, remember = true) => {
    setAccessToken(accessToken, remember);
    setRefreshToken(refreshToken, remember);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  updateTokens: (accessToken) => {
    setAccessToken(accessToken);
    set({ accessToken });
  },

  logout: () => {
    clearPortalAuth();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));

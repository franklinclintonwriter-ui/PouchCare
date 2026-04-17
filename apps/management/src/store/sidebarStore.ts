import { create } from 'zustand';

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  activeGroup: string | null;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  setActiveGroup: (group: string | null) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  activeGroup: null,

  toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  collapse: () => set({ isCollapsed: true }),
  expand: () => set({ isCollapsed: false }),
  openMobile: () => set({ isMobileOpen: true }),
  closeMobile: () => set({ isMobileOpen: false }),
  setActiveGroup: (group) => set({ activeGroup: group }),
}));

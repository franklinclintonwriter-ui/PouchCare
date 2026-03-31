import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

interface UiStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  commandPaletteOpen: boolean
  setCommandPalette: (open: boolean) => void
  slideOverOpen: boolean
  slideOverContent: React.ReactNode | null
  openSlideOver: (content: React.ReactNode) => void
  closeSlideOver: () => void
  pageTitle: string
  pageSubtitle: string | undefined
  pageActions: React.ReactNode | null
  setPageHeader: (title: string, subtitle?: string, actions?: React.ReactNode | null) => void
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString()
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  commandPaletteOpen: false,
  setCommandPalette: (open) => set({ commandPaletteOpen: open }),
  slideOverOpen: false,
  slideOverContent: null,
  openSlideOver: (content) => set({ slideOverOpen: true, slideOverContent: content }),
  closeSlideOver: () => set({ slideOverOpen: false, slideOverContent: null }),
  pageTitle: '',
  pageSubtitle: undefined,
  pageActions: null,
  setPageHeader: (title, subtitle, actions = null) => set({ pageTitle: title, pageSubtitle: subtitle, pageActions: actions }),
}))

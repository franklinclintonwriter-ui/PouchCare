import { create } from 'zustand'
import React from 'react'

interface Toast { id: string; type: 'success'|'error'|'warning'|'info'; title: string; message?: string }
interface UiStore {
  toasts: Toast[]
  addToast: (t: Omit<Toast,'id'>) => void
  removeToast: (id: string) => void
  slideOverOpen: boolean
  slideOverContent: React.ReactNode | null
  openSlideOver: (c: React.ReactNode) => void
  closeSlideOver: () => void
  pageTitle: string
  pageSubtitle: string | undefined
  pageActions: React.ReactNode | null
  setPageHeader: (title: string, subtitle?: string, actions?: React.ReactNode | null) => void
}

export const useUiStore = create<UiStore>((set) => ({
  toasts: [],
  addToast: (t) => {
    const id = Date.now().toString()
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  slideOverOpen: false, slideOverContent: null,
  openSlideOver: (c) => set({ slideOverOpen: true, slideOverContent: c }),
  closeSlideOver: () => set({ slideOverOpen: false, slideOverContent: null }),
  pageTitle: '',
  pageSubtitle: undefined,
  pageActions: null,
  setPageHeader: (title, subtitle, actions = null) => set({ pageTitle: title, pageSubtitle: subtitle, pageActions: actions }),
}))

import { create } from 'zustand';
import type { HeaderConfig } from '@/types/header';

interface HeaderState extends HeaderConfig {
  setHeader: (config: HeaderConfig) => void;
  clearHeader: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  title: '',
  description: undefined,
  breadcrumbs: [],
  actions: [],

  setHeader: (config) => set({
    title: config.title,
    description: config.description,
    breadcrumbs: config.breadcrumbs ?? [],
    actions: config.actions ?? [],
  }),

  clearHeader: () => set({
    title: '',
    description: undefined,
    breadcrumbs: [],
    actions: [],
  }),
}));

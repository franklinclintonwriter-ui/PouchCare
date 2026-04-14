import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('pouchcare_theme') as Theme | null;
  if (stored) return stored;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),

  setTheme: (theme) => {
    localStorage.setItem('pouchcare_theme', theme);
    set({ theme });
  },

  toggle: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('pouchcare_theme', next);
      return { theme: next };
    }),
}));

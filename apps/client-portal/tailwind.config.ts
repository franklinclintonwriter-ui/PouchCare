import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0B1120',
        'midnight-card': '#111827',
        'midnight-border': '#1E2A3D',
        'midnight-hover': '#1A2540',
        sky: { 400: '#38BDF8', 500: '#0EA5E9', 600: '#0284C7' },
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config

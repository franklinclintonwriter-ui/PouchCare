import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        sora: ['Sora', 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", 'Menlo', 'monospace'],
      },
      colors: {
        sky: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        navy: {
          900: '#080e1a',
          800: '#0d1628',
          700: '#111827',
          600: '#1e2a3d',
          500: '#263348',
          400: '#344560',
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #080e1a 0%, #0d1628 50%, #080e1a 100%)',
        'card-gradient': 'linear-gradient(160deg, #111827 0%, #0d1a2e 100%)',
        'sky-gradient':  'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
      },
      /* ── Animations — GPU-only (opacity + transform only) ── */
      animation: {
        'fade-up':    'fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both',
        'float':      'float 7s ease-in-out infinite',
        'float-slow': 'float 11s ease-in-out infinite reverse',
        'pulse-slow': 'pulse 3.5s ease-in-out infinite',
        'shimmer':    'shimmer 5s linear infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)   translateX(0px)'  },
          '33%':     { transform: 'translateY(-18px) translateX(10px)' },
          '66%':     { transform: 'translateY(8px)   translateX(-8px)' },
        },
        shimmer: {
          '0%,100%': { backgroundPosition: '0% 50%'   },
          '50%':     { backgroundPosition: '100% 50%' },
        },
      },
      transitionTimingFunction: {
        /* Spring easing — fast start, gentle settle */
        spring:  'cubic-bezier(0.22, 1, 0.36, 1)',
        /* Snappy ease-out for micro-interactions */
        snappy:  'cubic-bezier(0.35, 0, 0.25, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      boxShadow: {
        'glow-sky': '0 0 30px rgba(14,165,233,0.2)',
        'glow-lg':  '0 0 60px rgba(14,165,233,0.15)',
        'card':     '0 1px 3px rgba(0,0,0,0.3)',
        'card-hover': '0 14px 40px rgba(14,165,233,0.1)',
      },
    },
  },
  plugins: [forms],
} satisfies Config;

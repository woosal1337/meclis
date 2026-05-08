import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"EB Garamond"', 'ui-serif', 'Georgia', 'serif'],
        display: ['"Cinzel"', '"EB Garamond"', 'ui-serif', 'Georgia', 'serif'],
        pixel: ['"VT323"', '"Press Start 2P"', 'monospace'],
      },
      colors: {
        marble: {
          50: '#f6efdf',
          100: '#ecdfc4',
          200: '#d4bf95',
          300: '#b89a6c',
          400: '#937851',
          500: '#6f5a3a',
          600: '#52432b',
          700: '#3a2f20',
          800: '#231b13',
          deep: '#120c07',
        },
        parchment: '#f2e6c4',
        ink: '#1f1407',
        terracotta: {
          400: '#c47a4d',
          500: '#a85a32',
          600: '#8a4a1a',
          700: '#6a3713',
        },
        olive: {
          400: '#8a8a4d',
          500: '#6f6f33',
          700: '#3f4220',
        },
        teal: {
          deep: '#1c4148',
        },
        amber: {
          flame: '#e8a44a',
          ember: '#b96a26',
        },
      },
      boxShadow: {
        scroll: '0 1px 0 rgba(255,255,255,0.04) inset, 0 -1px 0 rgba(0,0,0,0.5) inset, 0 8px 18px rgba(0,0,0,0.45)',
        relief: '0 1px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
} satisfies Config;

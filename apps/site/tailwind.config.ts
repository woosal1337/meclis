import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx,mdx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1f1407',
          deep: '#120c07',
          stone: '#2b2014',
          stoneEdge: '#5a4324',
        },
        parchment: {
          DEFAULT: '#f2e6c4',
          dim: '#e3d4ac',
        },
        bronze: {
          DEFAULT: '#cf8d4a',
          deep: '#8a4a1a',
          glow: '#e8a44a',
        },
        laurel: '#7a8a4a',
      },
      fontFamily: {
        display: ['Cinzel', 'EB Garamond', 'ui-serif', 'Georgia', 'serif'],
        serif: ['EB Garamond', 'ui-serif', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SF Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      letterSpacing: {
        smallcaps: '0.18em',
      },
    },
  },
  plugins: [],
};

export default config;

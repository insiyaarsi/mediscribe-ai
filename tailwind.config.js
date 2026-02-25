/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
        head:  ['Sora', 'system-ui', 'sans-serif'],
        mono:  ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        // Brand
        primary: {
          DEFAULT: '#1A56DB',
          hover:   '#1648C0',
          light:   '#EBF3FF',
        },
        accent: {
          DEFAULT: '#0BA871',
          light:   '#E6F7F2',
        },
        // Sidebar
        sidebar: {
          DEFAULT: '#0D1B2A',
          2:       '#162235',
          3:       '#1E2F45',
          border:  '#1E2F45',
        },
        // Entity colours
        entity: {
          symptom:   '#E53E3E',
          medication:'#1A56DB',
          condition: '#7C3AED',
          procedure: '#0BA871',
          test:      '#D97706',
        },
        // Surfaces
        surface: {
          DEFAULT: '#FFFFFF',
          2:       '#F7FAFC',
          3:       '#EBF3FF',
        },
      },
      borderRadius: {
        DEFAULT: '10px',
        lg:      '14px',
        xl:      '18px',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        lg:    '0 10px 30px rgba(0,0,0,0.12)',
        blue:  '0 4px 14px rgba(26,86,219,0.35)',
      },
      animation: {
        'fade-up':   'fadeUp 380ms ease forwards',
        'fade-in':   'fadeIn 300ms ease forwards',
        'spin-slow': 'spin 1.2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
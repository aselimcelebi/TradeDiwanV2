/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6366f1',
          light:   '#818cf8',
          dark:    '#4f46e5',
          dim:     'rgba(99,102,241,0.15)',
        },
        surface: {
          base:     '#0a0c10',
          DEFAULT:  '#111418',
          elevated: '#181c22',
          hover:    '#1e232b',
        },
        pnl: {
          positive: '#22c55e',
          negative: '#ef4444',
        },
        'text-primary':   '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted':     '#475569',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      borderRadius: {
        lg:    '10px',
        xl:    '14px',
        '2xl': '18px',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        modal: '0 25px 50px -12px rgba(0,0,0,0.8)',
        glow:  '0 0 20px rgba(99,102,241,0.3)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};

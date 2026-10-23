/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#111827',
          800: '#1F2937',
          700: '#374151',
          600: '#4B5563',
        },
        brand: {
          blue: '#2563EB',
          'blue-hover': '#1D4ED8',
          'blue-light': '#EFF6FF',
        },
        cool: {
          bg: '#F3F6FA',
          subtle: '#EAEFF5',
        },
        card: {
          white: '#FFFFFF',
        },
        slate: {
          border: '#E2E8F0',
          muted: '#64748B',
          light: '#F8FAFC',
        },
        amber: {
          warn: '#D97706',
          'warn-light': '#FEF3C7',
          'warn-border': '#FDE68A',
        },
        red: {
          overdue: '#DC2626',
          'overdue-light': '#FEE2E2',
          'overdue-border': '#FECACA',
        },
        green: {
          paid: '#15803D',
          'paid-light': '#DCFCE7',
          'paid-border': '#BBF7D0',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Geist',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Geist Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(17, 24, 39, 0.05), 0 1px 2px -1px rgba(17, 24, 39, 0.03)',
        'card-hover': '0 4px 6px -1px rgba(17, 24, 39, 0.08), 0 2px 4px -2px rgba(17, 24, 39, 0.04)',
        drawer: '-4px 0 24px rgba(17, 24, 39, 0.1)',
      },
    },
  },
  plugins: [],
}

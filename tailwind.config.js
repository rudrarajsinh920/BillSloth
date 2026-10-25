/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Midnight Emerald + Electric Cyan Design System Tokens
        midnight: {
          bg: '#0B1220',
          surface: '#111D32',
          card: '#162238',
          'card-hover': '#1C2B46',
          border: '#29374D',
          borderLight: '#3E516D',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#A8B7CC',
          muted: '#64748B',
        },
        cyan: {
          DEFAULT: '#22D3EE',
          accent: '#22D3EE',
          glow: 'rgba(34, 211, 238, 0.15)',
        },
        emerald: {
          DEFAULT: '#34D399',
          accent: '#34D399',
          dark: '#059669',
        },
        amber: {
          DEFAULT: '#FBBF24',
          accent: '#FBBF24',
          warn: '#FBBF24',
          'warn-light': 'rgba(251, 191, 36, 0.15)',
          'warn-border': 'rgba(251, 191, 36, 0.3)',
        },
        red: {
          DEFAULT: '#FB7185',
          overdue: '#FB7185',
          'overdue-light': 'rgba(251, 113, 133, 0.15)',
          'overdue-border': 'rgba(251, 113, 133, 0.3)',
        },
        green: {
          paid: '#34D399',
          'paid-light': 'rgba(52, 211, 153, 0.15)',
          'paid-border': 'rgba(52, 211, 153, 0.3)',
        },
        indigo: {
          DEFAULT: '#818CF8',
          accent: '#818CF8',
        },
        // Semantic backwards-compatible aliases mapped to the new midnight design system
        navy: {
          900: '#F8FAFC', // Headings in white
          800: '#F1F5F9',
          700: '#E2E8F0',
          600: '#A8B7CC',
        },
        brand: {
          blue: '#22D3EE',
          'blue-hover': '#06B6D4',
          'blue-light': 'rgba(34, 211, 238, 0.15)',
        },
        cool: {
          bg: '#0B1220',
          subtle: '#111D32',
        },
        card: {
          white: '#162238',
        },
        slate: {
          border: '#29374D',
          muted: '#A8B7CC',
          light: '#111D32',
        },
      },
      fontFamily: {
        sans: [
          'Geist',
          'Inter',
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
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.35), 0 2px 6px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 12px 28px -6px rgba(0, 0, 0, 0.5), 0 4px 12px -2px rgba(34, 211, 238, 0.08)',
        drawer: '-4px 0 24px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}

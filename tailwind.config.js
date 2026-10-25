/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shared Light-First Design System Tokens
        page: {
          bg: '#F7F8F5',
        },
        card: {
          DEFAULT: '#FFFFFF',
          white: '#FFFFFF',
        },
        primary: {
          DEFAULT: '#087F8C',
          hover: '#066873',
          surface: '#DDF5F6',
        },
        teal: {
          DEFAULT: '#087F8C',
          hover: '#066873',
          surface: '#DDF5F6',
          50: '#F0FAFB',
          100: '#DDF5F6',
          200: '#B2E7EA',
          500: '#087F8C',
          600: '#066873',
          700: '#05535C',
        },
        text: {
          primary: '#172A35',
          secondary: '#526572',
          muted: '#71828D',
        },
        navy: {
          900: '#172A35',
          800: '#1F3746',
          700: '#2C4A5E',
          600: '#526572',
        },
        border: {
          subtle: '#DCE4E5',
          DEFAULT: '#DCE4E5',
        },
        // Financial Status Colors
        status: {
          success: {
            text: '#087F5B',
            bg: '#DDF7EF',
            border: 'rgba(8, 127, 91, 0.25)',
          },
          upcoming: {
            text: '#854D0E',
            bg: '#FFF0CC',
            border: 'rgba(133, 77, 14, 0.25)',
          },
          overdue: {
            text: '#BE123C',
            bg: '#FFE4E6',
            border: 'rgba(190, 18, 60, 0.25)',
          },
          review: {
            text: '#526572',
            bg: '#F1F5F9',
            border: '#DCE4E5',
          },
        },
        // AI Secondary Accent
        ai: {
          accent: '#6D5CE8',
          surface: '#F1EFFF',
        },
        // Cinematic Dark Intro Palette (intro only)
        intro: {
          bg: '#0B1724',
          panel: '#142536',
          teal: '#35D6C3',
          text: '#F5F8FA',
          muted: '#AABBC9',
        },
        // Semantic aliases
        brand: {
          blue: '#087F8C',
          'blue-hover': '#066873',
          'blue-light': '#DDF5F6',
        },
        cool: {
          bg: '#F7F8F5',
          subtle: '#FFFFFF',
        },
        slate: {
          border: '#DCE4E5',
          muted: '#526572',
          light: '#F7F8F5',
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
        card: '0 1px 3px 0 rgba(23, 42, 53, 0.05), 0 1px 2px -1px rgba(23, 42, 53, 0.05)',
        'card-hover': '0 4px 12px 0 rgba(23, 42, 53, 0.08), 0 2px 4px -1px rgba(23, 42, 53, 0.04)',
        drawer: '-4px 0 24px rgba(23, 42, 53, 0.12)',
      },
    },
  },
  plugins: [],
}

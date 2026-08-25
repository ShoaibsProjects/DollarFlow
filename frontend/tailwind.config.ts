/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0052FF',
          hover: '#0040CC',
          glow: 'rgba(0, 82, 255, 0.4)',
        },
        success: {
          DEFAULT: '#00D395',
          hover: '#00B880',
        },
        danger: {
          DEFAULT: '#FF6B6B',
          hover: '#E55A5A',
        },
        warning: {
          DEFAULT: '#FFB800',
        },
        purple: {
          DEFAULT: '#A78BFA',
        },
        pink: {
          DEFAULT: '#FF6B9D',
        },
        cyan: {
          DEFAULT: '#4ECDC4',
        },
        background: '#0A0B0D',
        surface: '#111317',
        'surface-elevated': '#1A1D23',
        border: '#2A2D35',
        foreground: '#F8F9FA',
        muted: '#6B7280',
        'muted-foreground': '#9CA3AF',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 300ms var(--ease-standard) forwards',
        'slide-up': 'slideUp 300ms var(--ease-standard) forwards',
        'slide-down': 'slideDown 300ms var(--ease-standard) forwards',
        'scale-in': 'scaleIn 200ms var(--ease-spring) forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px -5px rgba(0, 82, 255, 0.4)' },
          '50%': { boxShadow: '0 0 40px -5px rgba(0, 82, 255, 0.7)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '300ms',
        'slow': '500ms',
      },
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      boxShadow: {
        'glow': '0 0 30px -5px rgba(0, 82, 255, 0.4)',
        'glow-lg': '0 0 60px -10px rgba(0, 82, 255, 0.5)',
        'elevated': '0 20px 40px -12px rgba(0, 0, 0, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(0, 82, 255, 0.1)',
      },
      backgroundImage: {
        'mesh-gradient': 'radial-gradient(ellipse at 50% 50%, rgba(0, 82, 255, 0.15) 0%, transparent 70%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
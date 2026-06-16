/**
 * Tailwind preset-style configuration that defines the Sporting Wroclaw design tokens
 * and exports them as CSS custom properties for utility and raw CSS usage.
 */
import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,vue}',
    './components/**/*.{js,ts,vue}',
    './composables/**/*.{js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './types/**/*.{js,ts}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        surface: 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        'surface-sunken': 'var(--color-surface-sunken)',
        brand: {
          50: '#E6F1FB',
          100: '#B5D4F4',
          200: '#85B7EB',
          400: '#378ADD',
          700: '#185FA5',
          800: '#0C447C',
          900: '#042C53',
        },
        status: {
          confirmed: {
            bg: '#97C459',
            text: '#27500A',
            ring: '#639922',
          },
          declined: {
            bg: '#F0997B',
            text: '#4A1B0C',
            ring: '#D85A30',
          },
          pending: {
            bg: '#FAC775',
            text: '#412402',
            ring: '#BA7517',
          },
          neutral: {
            bg: '#D3D1C7',
            text: '#2C2C2A',
            ring: '#B4B2A9',
          },
        },
      },
      borderRadius: {
        card: '12px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['InterVariable', 'Inter', ...defaultTheme.fontFamily.sans],
        display: ['InterVariable', 'Inter', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        xs2: ['11px', { lineHeight: '1.4', letterSpacing: '0.05em' }],
        label: ['13px', { lineHeight: '1.5' }],
        body: ['16px', { lineHeight: '1.7' }],
        h3: ['16px', { lineHeight: '1.5', fontWeight: '500' }],
        h2: ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        h1: ['22px', { lineHeight: '1.3', fontWeight: '500' }],
      },
      boxShadow: {
        card: '0 8px 24px rgba(4, 44, 83, 0.08)',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': {
          '--color-brand-50': '#E6F1FB',
          '--color-brand-100': '#B5D4F4',
          '--color-brand-200': '#85B7EB',
          '--color-brand-400': '#378ADD',
          '--color-brand-700': '#185FA5',
          '--color-brand-800': '#0C447C',
          '--color-brand-900': '#042C53',
          '--color-primary': 'var(--color-brand-700)',
          '--color-primary-hover': 'var(--color-brand-800)',
          '--color-primary-subtle': 'var(--color-brand-50)',
          '--color-surface': '#FFFFFF',
          '--color-surface-raised': '#F7F9FC',
          '--color-surface-sunken': '#EFF3F8',
          '--color-border': '#E2E8F0',
          '--color-text-primary': '#0F172A',
          '--color-text-secondary': '#64748B',
          '--color-text-tertiary': '#94A3B8',
          '--color-text-on-primary': '#FFFFFF',
          '--status-confirmed-bg': '#97C459',
          '--status-confirmed-text': '#27500A',
          '--status-confirmed-ring': '#639922',
          '--status-declined-bg': '#F0997B',
          '--status-declined-text': '#4A1B0C',
          '--status-declined-ring': '#D85A30',
          '--status-pending-bg': '#FAC775',
          '--status-pending-text': '#412402',
          '--status-pending-ring': '#BA7517',
          '--status-neutral-bg': '#D3D1C7',
          '--status-neutral-text': '#2C2C2A',
          '--status-neutral-ring': '#B4B2A9',
          '--topbar-height': '56px',
          '--sidebar-width': '200px',
          '--bottomnav-height': '60px',
        },
        '.dark': {
          '--color-surface': '#0F172A',
          '--color-surface-raised': '#1E293B',
          '--color-surface-sunken': '#0B1120',
          '--color-border': '#1E293B',
          '--color-text-primary': '#F1F5F9',
          '--color-text-secondary': '#94A3B8',
          '--color-text-tertiary': '#64748B',
        },
      })
    }),
  ],
}

export default config

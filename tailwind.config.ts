import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const withOpacity = (variable: string) =>
  `color-mix(in oklch, var(${variable}) calc(<alpha-value> * 100%), transparent)`

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xs: 'var(--radius)',
        DEFAULT: 'var(--radius)',
        sm: 'calc(var(--radius) * 2)',
        md: 'calc(var(--radius) * 3)',
        lg: 'calc(var(--radius) * 4)',
        field: 'var(--field-radius)',
      },
      colors: {
        /* HeroUI Semantic Tokens */
        background: withOpacity('--background'),
        foreground: withOpacity('--foreground'),
        muted: withOpacity('--muted'),
        border: withOpacity('--border'),
        separator: withOpacity('--separator'),
        focus: withOpacity('--focus'),
        scrollbar: withOpacity('--scrollbar'),
        accent: {
          DEFAULT: withOpacity('--accent'),
          foreground: withOpacity('--accent-foreground'),
        },
        default: {
          DEFAULT: withOpacity('--default'),
          foreground: withOpacity('--default-foreground'),
        },
        surface: {
          DEFAULT: withOpacity('--surface'),
          foreground: withOpacity('--surface-foreground'),
          secondary: withOpacity('--surface-secondary'),
          'secondary-foreground': withOpacity('--surface-secondary-foreground'),
          tertiary: withOpacity('--surface-tertiary'),
          'tertiary-foreground': withOpacity('--surface-tertiary-foreground'),
        },
        overlay: {
          DEFAULT: withOpacity('--overlay'),
          foreground: withOpacity('--overlay-foreground'),
        },
        segment: {
          DEFAULT: withOpacity('--segment'),
          foreground: withOpacity('--segment-foreground'),
        },
        field: {
          background: withOpacity('--field-background'),
          border: 'var(--field-border)',
          foreground: withOpacity('--field-foreground'),
          placeholder: withOpacity('--field-placeholder'),
        },
        success: {
          DEFAULT: withOpacity('--success'),
          foreground: withOpacity('--success-foreground'),
        },
        warning: {
          DEFAULT: withOpacity('--warning'),
          foreground: withOpacity('--warning-foreground'),
        },
        danger: {
          DEFAULT: withOpacity('--danger'),
          foreground: withOpacity('--danger-foreground'),
        },
        info: {
          DEFAULT: withOpacity('--info'),
          foreground: withOpacity('--info-foreground'),
        },

        /* Coolors Brand Palette */
        'light-green': {
          50: '#f3fdef',
          100: '#e2fad9',
          200: '#c7f6b8',
          300: '#acf39d',
          400: '#7ce569',
          500: '#4ecd3b',
          600: '#35a926',
          700: '#2a8420',
          800: '#25681e',
          900: '#1f571b',
          950: '#0b3109',
          DEFAULT: '#acf39d',
        },
        watermelon: {
          50: '#fff1f3',
          100: '#ffe0e5',
          200: '#ffc6d0',
          300: '#ff9eae',
          400: '#ff6680',
          500: '#ef3054',
          600: '#dc1a43',
          700: '#b91036',
          800: '#9b1033',
          900: '#841231',
          950: '#4a0417',
          DEFAULT: '#ef3054',
        },
        'shadow-grey': {
          50: '#f6f5f7',
          100: '#eceaec',
          200: '#dcd9de',
          300: '#c2bcc7',
          400: '#9f96a6',
          500: '#7f7588',
          600: '#645c6c',
          700: '#504956',
          800: '#423c47',
          900: '#2d2a32',
          950: '#1c1a20',
          DEFAULT: '#2d2a32',
        },
        'brilliant-azure': {
          50: '#f0f7fe',
          100: '#deedfc',
          200: '#c4e0fa',
          300: '#9bccf7',
          400: '#6bb0f1',
          500: '#3083dc',
          600: '#246ecc',
          700: '#1c58b3',
          800: '#1c4892',
          900: '#1d3f75',
          950: '#162848',
          DEFAULT: '#3083dc',
        },
        'peach-fuzz': {
          50: '#fff5f0',
          100: '#ffe9de',
          200: '#ffcab1',
          300: '#ffb28e',
          400: '#ff8a56',
          500: '#fb6424',
          600: '#eb4912',
          700: '#c3360e',
          800: '#9b2d14',
          900: '#7d2814',
          950: '#431108',
          DEFAULT: '#ffcab1',
        },
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, #acf39d 0%, #3083dc 38%, #ef3054 74%, #ffcab1 100%)',
        'brand-gradient-soft':
          'linear-gradient(135deg, rgba(172, 243, 157, 0.25) 0%, rgba(48, 131, 220, 0.16) 50%, rgba(255, 202, 177, 0.28) 100%)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config

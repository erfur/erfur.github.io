// @ts-check
const colors = require('tailwindcss/colors')

/** @type {import("tailwindcss/types").Config } */
module.exports = {
  content: [
    './node_modules/pliny/**/*.js',
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,tsx}',
    './components/**/*.{js,ts,tsx}',
    './layouts/**/*.{js,ts,tsx}',
    './data/**/*.mdx',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-roboto)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-roboto-slab)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
      },
      colors: {
        primary: colors.sky,
        gray: colors.slate,
      },
      fontSize: {
        base: '1.05rem',
        sm: '0.9rem',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            fontFamily: theme('fontFamily.sans').join(', '),
            p: {
              fontSize: '1.1rem',
              lineHeight: '1.75',
            },
            'ul, ol': {
              fontSize: '1.05rem',
            },
            a: {
              color: theme('colors.primary.600'),
              '&:hover': {
                color: `${theme('colors.primary.700')}`,
              },
              fontSize: '1.1rem',
              transition: 'color 150ms ease',
            },
            'h1,h2,h3,h4,h5,h6': {
              fontFamily: theme('fontFamily.heading').join(', '),
              fontWeight: '700',
              letterSpacing: '-0.025em',
            },
            code: {
              fontFamily: theme('fontFamily.mono').join(', '),
              color: theme('colors.primary.600'),
              fontSize: '0.9rem',
              fontWeight: '400',
            },
            'pre code': {
              fontFamily: theme('fontFamily.mono').join(', '),
            },
          },
        },
        invert: {
          css: {
            a: {
              color: theme('colors.primary.400'),
              '&:hover': {
                color: `${theme('colors.primary.300')}`,
              },
            },
            code: {
              color: theme('colors.primary.400'),
            },
            'h1,h2,h3,h4,h5,h6': {
              color: theme('colors.gray.200'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}

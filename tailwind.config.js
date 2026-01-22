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
              fontSize: '1rem',
              lineHeight: '1.6',
            },
            'ul, ol': {
              fontSize: '1rem',
            },
            a: {
              color: theme('colors.gray.600'),
              '&:hover': {
                color: `${theme('colors.gray.800')}`,
              },
              fontSize: '1rem',
              fontWeight: '400',
              transition: 'color 150ms ease',
            },
            'h1,h2,h3,h4,h5,h6': {
              fontFamily: theme('fontFamily.heading').join(', '),
              fontWeight: '400',
              letterSpacing: '-0.025em',
            },
            code: {
              fontFamily: theme('fontFamily.mono').join(', '),
              color: theme('colors.gray.700'),
              backgroundColor: theme('colors.gray.100'),
              fontSize: '0.9rem',
              fontWeight: '400',
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
            },
            'code::before': {
              content: 'none',
            },
            'code::after': {
              content: 'none',
            },
            'pre code': {
              fontFamily: theme('fontFamily.mono').join(', '),
              backgroundColor: 'transparent',
              padding: '0',
            },
          },
        },
        invert: {
          css: {
            a: {
              color: theme('colors.gray.400'),
              '&:hover': {
                color: `${theme('colors.gray.200')}`,
              },
            },
            code: {
              color: theme('colors.gray.300'),
              backgroundColor: theme('colors.gray.700'),
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

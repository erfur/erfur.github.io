// @ts-check
const { fontFamily } = require('tailwindcss/defaultTheme')
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
    fontFamily: {
      hack: ['var(--font-hack-nf)', ...fontFamily.sans],
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-fixedsys-excelsior)', ...fontFamily.sans],
        // serif: ['var(--font-hack-nf)', ...fontFamily.serif],
        mono: ['var(--font-hack-nf)', ...fontFamily.mono],
      },
      lineHeight: {
        11: '2.75rem',
        12: '3rem',
        13: '3.25rem',
        14: '3.5rem',
      },
      fontSize: {
        sm: '1rem',
        base: '1.125rem',
        lg: '1.25rem',
      },
      colors: {
        primary: colors.purple,
        gray: colors.gray,
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            a: {
              color: theme('colors.primary.600'),
              '&:hover': {
                color: `${theme('colors.primary.700')}`,
              },
              code: { color: theme('colors.primary.600') },
            },
            'h1,h2': {
              fontWeight: '700',
              letterSpacing: theme('letterSpacing.tight'),
            },
            h3: {
              fontWeight: '600',
            },
            code: {
              color: theme('colors.indigo.500'),
            },
          },
        },
        invert: {
          css: {
            a: {
              color: theme('colors.primary.500'),
              '&:hover': {
                color: `${theme('colors.primary.500')}`,
              },
              code: { color: theme('colors.primary.500') },
            },
            'h1,h2,h3,h4,h5,h6': {
              color: theme('colors.gray.300'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}

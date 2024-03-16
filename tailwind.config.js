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
    extend: {
      fontFamily: {
        ui: ['var(--font-ibm-plex-mono)', ...fontFamily.mono],
        sans: ['var(--font-pt-sans)', ...fontFamily.sans],
        mono: ['var(--font-jetbrains-mono)', ...fontFamily.mono],
      },
      colors: {
        primary: colors.indigo,
        gray: colors.gray,
      },
      fontSize: {
        base: '1.05rem',
        sm: '0.9rem',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            p: {
              fontSize: '1.25rem',
            },
            'ul, ol': {
              fontSize: '1.2rem',
            },
            a: {
              color: theme('colors.indigo.500'),
              '&:hover': {
                color: `${theme('colors.indigo.900')}`,
              },
              fontSize: '1.25rem',
            },
            'h1,h2,h3,h4,h5,h6': {
              fontFamily: 'var(--font-fixedsys-excelsior)',
              letterSpacing: theme('letterSpacing.tight'),
            },
            code: {
              color: theme('colors.indigo.500'),
              fontSize: '0.95rem',
            },
          },
        },
        invert: {
          css: {
            a: {
              color: theme('colors.indigo.400'),
              '&:hover': {
                color: `${theme('colors.indigo.200')}`,
              },
            },
            code: {
              color: theme('colors.indigo.400'),
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

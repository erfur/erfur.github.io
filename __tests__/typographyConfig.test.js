const config = require('../tailwind.config')

const extendedTheme = config.theme.extend

function theme(path) {
  return path.split('.').reduce((value, key) => value[key], extendedTheme)
}

describe('Clinical Precision theme', () => {
  it('defines the semantic light palette exactly', () => {
    expect(extendedTheme.colors).toMatchObject({
      surface: '#f7f9fb',
      'surface-container-lowest': '#ffffff',
      'surface-container-low': '#f2f4f6',
      'surface-container': '#eceef0',
      'surface-container-high': '#e6e8ea',
      'surface-container-highest': '#e0e3e5',
      'on-surface': '#191c1e',
      'on-surface-variant': '#574140',
      'inverse-surface': '#2d3133',
      'inverse-on-surface': '#eff1f3',
      outline: '#8b7170',
      'outline-variant': '#debfbe',
      primary: {
        DEFAULT: '#a83639',
        600: '#a83639',
      },
      'on-primary': '#ffffff',
      'primary-container': '#f87171',
      'on-primary-container': '#6c0513',
      'inverse-primary': '#ffb3b0',
      secondary: '#545f73',
      tertiary: '#505f76',
      error: '#ba1a1a',
    })
  })

  it('maps Pliny search shade contracts to the semantic palette', () => {
    expect(extendedTheme.colors.gray).toEqual({
      50: '#ffffff',
      100: '#f2f4f6',
      200: '#eceef0',
      300: '#e0e3e5',
      400: '#8b7170',
      500: '#574140',
      600: '#505f76',
      700: '#191c1e',
      800: '#2d3133',
      900: '#202426',
    })
  })

  it('uses JetBrains Mono for every text role', () => {
    expect(extendedTheme.fontFamily).toEqual({
      mono: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
      sans: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
      heading: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
    })
  })

  it('defines the approved type scale', () => {
    expect(extendedTheme.fontSize).toMatchObject({
      'headline-lg': [
        '2rem',
        { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '700' },
      ],
      'headline-lg-mobile': [
        '1.5rem',
        { lineHeight: '2rem', letterSpacing: '-0.02em', fontWeight: '700' },
      ],
      'headline-md': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
      'body-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
      'body-md': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
      'label-sm': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em', fontWeight: '500' }],
      'code-inline': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '400' }],
    })
  })

  it('uses the body and inline-code roles in prose', () => {
    const css = extendedTheme.typography({ theme }).DEFAULT.css
    expect(css.fontFamily).toBe('var(--font-jetbrains-mono), Menlo, monospace')
    expect(css.p).toMatchObject({ fontSize: '1rem', lineHeight: '1.5rem' })
    expect(css.code).toMatchObject({
      fontSize: '0.8125rem',
      lineHeight: '1.125rem',
      borderRadius: '0',
    })
    expect(css.img).toMatchObject({ borderRadius: '0', boxShadow: 'none' })
  })

  it('uses prose variables so inverse colors apply in dark mode', () => {
    const css = extendedTheme.typography({ theme }).DEFAULT.css
    expect(css).toMatchObject({
      '--tw-prose-body': '#191c1e',
      '--tw-prose-links': '#a83639',
      '--tw-prose-code': '#191c1e',
      color: 'var(--tw-prose-body)',
    })
    expect(css.a.color).toBe('var(--tw-prose-links)')
    expect(css.code.color).toBe('var(--tw-prose-code)')
  })
})

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
        400: '#881d24',
        500: '#a83639',
        600: '#a83639',
        700: '#881d24',
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

  it('maps Pliny newsletter states to approved semantic reds', () => {
    expect(extendedTheme.colors.primary).toEqual({
      DEFAULT: '#a83639',
      400: '#881d24',
      500: '#a83639',
      600: '#a83639',
      700: '#881d24',
    })
  })

  it('uses JetBrains Mono for interface roles and Merriweather for post bodies', () => {
    expect(extendedTheme.fontFamily).toEqual({
      mono: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
      sans: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
      heading: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
      proseBody: ['var(--font-merriweather)', 'Georgia', 'serif'],
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

  it('scopes the Merriweather reading scale to post paragraphs and lists', () => {
    const typography = extendedTheme.typography({ theme })
    expect(typography.post.css).toEqual({
      p: {
        fontFamily: 'var(--font-merriweather), Georgia, serif',
        fontSize: '1.1rem',
        lineHeight: '1.6',
      },
      'ul, ol': {
        fontFamily: 'var(--font-merriweather), Georgia, serif',
        fontSize: '1.1rem',
        lineHeight: '1.6',
      },
    })
    expect(typography.DEFAULT.css.fontFamily).toBe(
      'var(--font-jetbrains-mono), Menlo, monospace'
    )
    expect(typography.DEFAULT.css['h1,h2,h3,h4,h5,h6'].fontFamily).toBe(
      'var(--font-jetbrains-mono), Menlo, monospace'
    )
    expect(typography.DEFAULT.css.a.fontFamily).toBe(
      'var(--font-jetbrains-mono), Menlo, monospace'
    )
    expect(typography.DEFAULT.css.code.fontFamily).toBe(
      'var(--font-jetbrains-mono), Menlo, monospace'
    )
  })

  it('uses prose variables so inverse foreground and background colors apply', () => {
    const typography = extendedTheme.typography({ theme })
    expect(typography.DEFAULT.css).toMatchObject({
      '--tw-prose-body': '#191c1e',
      '--tw-prose-links': '#a83639',
      '--tw-prose-code': '#191c1e',
      '--tw-prose-code-bg': '#eceef0',
      color: 'var(--tw-prose-body)',
    })
    expect(typography.DEFAULT.css.a.color).toBe('var(--tw-prose-links)')
    expect(typography.DEFAULT.css.code).toMatchObject({
      color: 'var(--tw-prose-code)',
      backgroundColor: 'var(--tw-prose-code-bg)',
    })
    expect(typography.invert.css).toMatchObject({
      '--tw-prose-code': '#eff1f3',
      '--tw-prose-code-bg': '#383d40',
    })
  })

  it('uses semantic variables for captions and table surfaces in both themes', () => {
    const typography = extendedTheme.typography({ theme })
    expect(typography.DEFAULT.css).toMatchObject({
      '--tw-prose-captions': '#505f76',
      '--tw-prose-table-head-border': '#8b7170',
      '--tw-prose-table-row-border': '#debfbe',
      '--tw-prose-table-row-even': '#f2f4f6',
      figcaption: { color: 'var(--tw-prose-captions)' },
      thead: { borderBottomColor: 'var(--tw-prose-table-head-border)' },
      'tbody tr': { borderBottomColor: 'var(--tw-prose-table-row-border)' },
      'tbody tr:nth-child(even)': { backgroundColor: 'var(--tw-prose-table-row-even)' },
    })
    expect(typography.invert.css).toMatchObject({
      '--tw-prose-captions': '#b7c8e1',
      '--tw-prose-table-head-border': '#8b7170',
      '--tw-prose-table-row-border': '#8b7170',
      '--tw-prose-table-row-even': '#383d40',
    })
  })

  it('uses semantic image-border variables in both themes', () => {
    const typography = extendedTheme.typography({ theme })
    expect(typography.DEFAULT.css).toMatchObject({
      '--tw-prose-image-border': '#debfbe',
      img: { border: '1px solid var(--tw-prose-image-border)' },
    })
    expect(typography.invert.css).toMatchObject({
      '--tw-prose-image-border': '#8b7170',
    })
  })
})

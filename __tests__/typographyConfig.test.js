const config = require('../tailwind.config')

const extendedTheme = config.theme.extend

function theme(path) {
  return path.split('.').reduce((value, key) => value[key], extendedTheme)
}

describe('post body typography', () => {
  const typography = extendedTheme.typography({ theme })

  it('defines the scoped Merriweather family', () => {
    expect(extendedTheme.fontFamily.proseBody).toEqual([
      'var(--font-merriweather)',
      'Georgia',
      'serif',
    ])
  })

  it('uses Merriweather at 1.1rem for paragraphs and lists only', () => {
    const css = typography.post.css

    expect(css.p).toMatchObject({
      fontFamily: 'var(--font-merriweather), Georgia, serif',
      fontSize: '1.1rem',
      lineHeight: '1.6',
    })
    expect(css['ul, ol']).toMatchObject({
      fontFamily: 'var(--font-merriweather), Georgia, serif',
      fontSize: '1.1rem',
    })
    expect(typography.DEFAULT.css.fontFamily).toBe('var(--font-roboto), system-ui, sans-serif')
    expect(typography.DEFAULT.css['h1,h2,h3,h4,h5,h6'].fontFamily).toBe(
      'var(--font-roboto-slab), Georgia, serif'
    )
    expect(typography.DEFAULT.css.code.fontFamily).toBe(
      'var(--font-jetbrains-mono), Menlo, monospace'
    )
  })
})

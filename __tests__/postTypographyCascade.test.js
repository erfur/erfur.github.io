const postcss = require('postcss')
const tailwindcss = require('tailwindcss')
const config = require('../tailwind.config')

const jetbrainsMono = 'var(--font-jetbrains-mono), Menlo, monospace'
const merriweather = 'var(--font-merriweather), Georgia, serif'

let generatedCss

beforeAll(async () => {
  const result = await postcss([
    tailwindcss({
      ...config,
      content: [
        {
          raw: `
            <article class="prose prose-post max-w-none">
              <p>Post paragraph</p>
              <ul>
                <li>
                  List item
                  <h2>Heading</h2>
                  <a href="#example">Link</a>
                  <code>code</code>
                  <pre><code>fenced code</code></pre>
                  <table><tbody><tr><td>Table</td></tr></tbody></table>
                  <figure><figcaption>Caption</figcaption></figure>
                </li>
              </ul>
            </article>
          `,
        },
      ],
    }),
  ]).process('@tailwind components; @tailwind utilities;', { from: undefined })

  generatedCss = postcss.parse(result.css)
})

function generatedFontFamily(selectorFragment) {
  let fontFamily

  generatedCss.walkRules((rule) => {
    if (rule.selector.includes(selectorFragment)) {
      rule.walkDecls('font-family', (declaration) => {
        fontFamily = declaration.value
      })
    }
  })

  return fontFamily
}

function resolvedFontFamily(...inheritanceChain) {
  return inheritanceChain
    .map(generatedFontFamily)
    .find((fontFamily) => fontFamily && fontFamily !== 'inherit')
}

it('generates Merriweather declarations for post paragraphs and lists', () => {
  expect(generatedFontFamily('.prose-post :where(p)')).toBe(merriweather)
  expect(generatedFontFamily('.prose-post :where(ul, ol)')).toBe(merriweather)
})

it('generates JetBrains declarations for protected elements nested in post lists', () => {
  expect(generatedFontFamily('.prose :where(h1,h2,h3,h4,h5,h6)')).toBe(jetbrainsMono)
  expect(generatedFontFamily('.prose :where(a)')).toBe(jetbrainsMono)
  expect(generatedFontFamily('.prose :where(code)')).toBe(jetbrainsMono)
  expect(generatedFontFamily('.prose :where(pre)')).toBe(jetbrainsMono)
  expect(generatedFontFamily('.prose :where(table)')).toBe(jetbrainsMono)
  expect(generatedFontFamily('.prose :where(figcaption)')).toBe(jetbrainsMono)
})

it('resolves fenced code nested in a post list through the pre declaration', () => {
  expect(generatedFontFamily('.prose :where(pre code)')).toBe('inherit')
  expect(
    resolvedFontFamily(
      '.prose :where(pre code)',
      '.prose :where(pre)',
      '.prose-post :where(ul, ol)'
    )
  ).toBe(jetbrainsMono)
})

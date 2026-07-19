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
              <blockquote>Quoted prose</blockquote>
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

function generatedDeclaration(selectorFragment, property) {
  let value

  generatedCss.walkRules((rule) => {
    if (rule.selector.includes(selectorFragment)) {
      rule.walkDecls(property, (declaration) => {
        value = declaration.value
      })
    }
  })

  return value
}

function generatedFontFamily(selectorFragment) {
  return generatedDeclaration(selectorFragment, 'font-family')
}

function generatedFontSize(selectorFragment) {
  return generatedDeclaration(selectorFragment, 'font-size')
}

function resolvedFontFamily(...inheritanceChain) {
  return inheritanceChain
    .map(generatedFontFamily)
    .find((fontFamily) => fontFamily && fontFamily !== 'inherit')
}

it('establishes inherited Merriweather on the post prose root', () => {
  expect(generatedFontFamily('.prose-post')).toBe(merriweather)
  expect(generatedFontFamily('.prose-post :where(p)')).toBeUndefined()
  expect(generatedFontFamily('.prose-post :where(ul, ol)')).toBeUndefined()
  expect(generatedFontFamily('.prose :where(a)')).toBeUndefined()
  expect(generatedFontFamily('.prose :where(table)')).toBeUndefined()
  expect(generatedFontFamily('.prose :where(figcaption)')).toBeUndefined()
  expect(generatedFontFamily('.prose :where(blockquote)')).toBeUndefined()
})

it('generates JetBrains declarations only for protected post elements', () => {
  expect(generatedFontFamily('.prose :where(h1,h2,h3,h4,h5,h6)')).toBe(jetbrainsMono)
  expect(generatedFontFamily('.prose :where(code)')).toBe(jetbrainsMono)
  expect(generatedFontFamily('.prose :where(pre)')).toBe(jetbrainsMono)
})

it('matches inline code to the post reading size without changing fenced code', () => {
  expect(generatedFontSize('.prose-post :where(code:not(pre code))')).toBe('1.1rem')
  expect(generatedFontSize('.prose :where(pre code)')).toBe('inherit')
})

it('resolves fenced code nested in a post list through the pre declaration', () => {
  expect(generatedFontFamily('.prose :where(pre code)')).toBe('inherit')
  expect(
    resolvedFontFamily(
      '.prose :where(pre code)',
      '.prose :where(pre)',
      '.prose-post'
    )
  ).toBe(jetbrainsMono)
})

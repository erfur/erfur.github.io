const fs = require('fs')
const path = require('path')

const globalCss = fs.readFileSync(path.join(__dirname, '../css/tailwind.css'), 'utf8')
const prismCss = fs.readFileSync(path.join(__dirname, '../css/prism.css'), 'utf8')

it('defines square semantic controls and visible focus', () => {
  expect(globalCss).toContain('border-radius: 0;')
  expect(globalCss).toContain('outline: 2px solid #a83639;')
  expect(globalCss).toContain('border-color: #f87171;')
})

it('uses the inverse focus outline in dark mode', () => {
  expect(globalCss).toMatch(
    /\.dark :where\(a, button, input, textarea, select\):focus-visible\s*{[^}]*outline: 2px solid #ffb3b0;/s
  )
})

it('uses Clinical Precision syntax colors without rounded corners or shadows', () => {
  expect(prismCss).toContain('color: #ffb3b0;')
  expect(prismCss).toContain('color: #8d9db5;')
  expect(prismCss).toContain('background: #202426;')
  expect(prismCss).not.toMatch(/rounded|shadow/)
})

it('uses two-pixel code-line edge markers', () => {
  expect(prismCss).toMatch(/\.code-line\s*{[^}]*border-l-2/s)
  expect(prismCss).toMatch(/\.highlight-line\s*{[^}]*border-l-2/s)
  expect(prismCss).not.toContain('border-l-4')
})

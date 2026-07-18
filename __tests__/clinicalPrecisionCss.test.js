const fs = require('fs')
const path = require('path')

const globalCss = fs.readFileSync(path.join(__dirname, '../css/tailwind.css'), 'utf8')
const prismCss = fs.readFileSync(path.join(__dirname, '../css/prism.css'), 'utf8')

it('defines square semantic controls and visible focus', () => {
  expect(globalCss).toContain('border-radius: 0;')
  expect(globalCss).toContain('outline: 2px solid #a83639;')
  expect(globalCss).toContain('border-color: #f87171;')
})

it('uses Clinical Precision syntax colors without rounded corners or shadows', () => {
  expect(prismCss).toContain('color: #ffb3b0;')
  expect(prismCss).toContain('color: #8d9db5;')
  expect(prismCss).toContain('background: #202426;')
  expect(prismCss).not.toMatch(/rounded|shadow/)
})

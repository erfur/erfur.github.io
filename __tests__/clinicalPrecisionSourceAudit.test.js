const fs = require('fs')
const path = require('path')

const files = [
  'app/Main.tsx',
  'app/projects/page.tsx',
  'app/tags/page.tsx',
  'app/not-found.tsx',
  'components/Card.tsx',
  'components/Tag.tsx',
  'layouts/ListLayout.tsx',
  'layouts/ListLayoutWithTags.tsx',
]

it.each(files)('%s contains no legacy visual utilities', (file) => {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  expect(source).not.toMatch(/\b(?:rounded(?:-[\w/]+)?|shadow(?:-[\w/]+)?)\b/)
  expect(source).not.toMatch(/\b(?:text|bg|border|ring|placeholder)-(?:gray|slate|blue)-/)
  expect(source).not.toMatch(/font-(?:proseBody)/)
})

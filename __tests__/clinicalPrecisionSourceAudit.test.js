const fs = require('fs')
const path = require('path')

function collectTsxFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : collectTsxFiles(fullPath)
    }
    return entry.name.endsWith('.tsx') ? [fullPath] : []
  })
}

const roots = ['app', 'components', 'layouts']
const files = roots.flatMap((root) => collectTsxFiles(path.join(__dirname, '..', root)))

it.each(files)('%s contains no legacy visual utilities', (file) => {
  const source = fs.readFileSync(file, 'utf8')
  expect(source).not.toMatch(/\b(?:rounded(?:-[\w/]+)?|shadow(?:-[\w/]+)?)\b/)
  expect(source).not.toMatch(/\b(?:text|bg|border|ring|placeholder)-(?:gray|slate|blue)-/)
  expect(source).not.toMatch(/font-proseBody/)
})

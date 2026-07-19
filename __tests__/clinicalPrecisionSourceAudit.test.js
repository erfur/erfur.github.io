const fs = require('fs')
const path = require('path')

function collectFiles(directory, extension) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : collectFiles(fullPath, extension)
    }
    return entry.name.endsWith(extension) ? [fullPath] : []
  })
}

const roots = ['app', 'components', 'layouts']
const files = roots.flatMap((root) => collectFiles(path.join(__dirname, '..', root), '.tsx'))
const cssFiles = collectFiles(path.join(__dirname, '..', 'css'), '.css')

it.each(files)('%s contains no legacy visual utilities', (file) => {
  const source = fs.readFileSync(file, 'utf8')
  expect(source).not.toMatch(/\b(?:rounded(?:-[\w/]+)?|shadow(?:-[\w/]+)?)\b/)
  expect(source).not.toMatch(/\b(?:text|bg|border|ring|placeholder)-(?:gray|slate|blue)-/)
  expect(source).not.toMatch(/font-proseBody/)
  expect(source).not.toMatch(/\bprose-(?:gray|slate|blue)\b/)
})

it.each(cssFiles)('%s contains no legacy visual utilities', (file) => {
  const source = fs.readFileSync(file, 'utf8')
  expect(source).not.toMatch(/\b(?:text|bg|border|ring|placeholder)-(?:gray|slate|blue)-/)
  expect(source).not.toMatch(/font-proseBody/)
})

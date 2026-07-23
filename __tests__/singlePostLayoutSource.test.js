const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const routeSource = fs.readFileSync(path.join(root, 'app/blog/[...slug]/page.tsx'), 'utf8')
const contentlayerSource = fs.readFileSync(path.join(root, 'contentlayer.config.ts'), 'utf8')
const blogSchema = contentlayerSource.slice(
  contentlayerSource.indexOf('export const Blog'),
  contentlayerSource.indexOf('export const Authors')
)
const authorSchema = contentlayerSource.slice(contentlayerSource.indexOf('export const Authors'))

it('renders blog posts through one direct layout', () => {
  expect(routeSource.match(/from '@\/layouts\//g)).toHaveLength(1)
  expect(routeSource).toContain('<PostLayout')
  expect(routeSource).not.toMatch(/const layouts\s*=/)
  expect(routeSource).not.toContain('post.layout')
})

it('removes layout selection only from blog frontmatter', () => {
  expect(blogSchema).not.toMatch(/\n\s+layout:/)
  expect(authorSchema).toMatch(/\n\s+layout:/)
})

import { render, screen } from '@testing-library/react'
import CustomLink from '@/components/Link'

describe('CustomLink', () => {
  it('renders an internal link as a same-tab anchor', () => {
    render(<CustomLink href="/blog">Blog</CustomLink>)
    const link = screen.getByRole('link', { name: 'Blog' })
    expect(link).toHaveAttribute('href', '/blog')
    expect(link).not.toHaveAttribute('target')
  })

  it('renders an in-page anchor link in the same tab', () => {
    render(<CustomLink href="#section">Section</CustomLink>)
    const link = screen.getByRole('link', { name: 'Section' })
    expect(link).toHaveAttribute('href', '#section')
    expect(link).not.toHaveAttribute('target')
  })

  it('opens external links in a new tab with rel="noopener noreferrer"', () => {
    render(<CustomLink href="https://example.com">Example</CustomLink>)
    const link = screen.getByRole('link', { name: 'Example' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})

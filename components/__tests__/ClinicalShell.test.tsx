import { render, screen } from '@testing-library/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

jest.mock('@/data/siteMetadata', () => ({
  __esModule: true,
  default: {
    author: 'Test Author',
    email: 'test@example.com',
    github: 'https://github.com/example',
    headerTitle: 'Test Site',
  },
}))

jest.mock('@/data/headerNavLinks', () => ({
  __esModule: true,
  default: [
    { href: '/', title: 'Home' },
    { href: '/blog', title: 'Blog' },
  ],
}))

jest.mock('@/data/logo.svg', () => ({
  __esModule: true,
  default: (props: React.SVGProps<SVGSVGElement>) => <svg aria-label="Logo" {...props} />,
}))

jest.mock('@/components/MobileNav', () => ({
  __esModule: true,
  default: () => <button>Menu</button>,
}))

jest.mock('@/components/ThemeSwitch', () => ({
  __esModule: true,
  default: () => <button>Theme</button>,
}))

jest.mock('@/components/social-icons', () => ({
  __esModule: true,
  default: ({ kind }: { kind: string }) => <a href={`https://example.com/${kind}`}>{kind}</a>,
}))

it('uses semantic square navigation styling', () => {
  render(<Header />)

  expect(screen.getByRole('banner')).toHaveClass('text-on-surface')
  expect(screen.getByRole('link', { name: 'Blog' })).toHaveClass(
    'text-body-md',
    'hover:bg-surface-container-low',
    'dark:hover:bg-[#383d40]'
  )
})

it('uses the semantic footer divider and label typography', () => {
  render(<Footer />)

  expect(screen.getByRole('contentinfo')).toHaveClass('border-outline-variant')
  expect(screen.getByText(/©/)).toHaveClass('text-label-sm', 'uppercase', 'text-tertiary')
})

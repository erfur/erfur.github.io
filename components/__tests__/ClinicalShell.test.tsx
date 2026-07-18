import { readFileSync } from 'fs'
import { join } from 'path'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SearchButton from '@/components/SearchButton'
import SocialIcon from '@/components/social-icons'

const setTheme = jest.fn()

jest.mock('@/data/siteMetadata', () => ({
  __esModule: true,
  default: {
    author: 'Test Author',
    email: 'test@example.com',
    github: 'https://github.com/example',
    headerTitle: 'Test Site',
    search: { provider: 'kbar' },
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

jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme }),
}))

jest.mock('pliny/search/AlgoliaButton', () => ({
  AlgoliaButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}))

jest.mock('pliny/search/KBarButton', () => ({
  KBarButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}))

beforeEach(() => {
  setTheme.mockClear()
  document.body.style.overflow = ''
})

it('renders the semantic header and actual square navigation controls', () => {
  render(<Header />)

  expect(screen.getByRole('banner')).toHaveClass('text-on-surface')
  expect(screen.getAllByRole('link', { name: 'Blog' })[0]).toHaveClass(
    'text-body-md',
    'hover:bg-surface-container-low',
    'dark:hover:bg-[#383d40]'
  )

  const controls = [
    screen.getByRole('link', { name: 'github' }),
    screen.getByRole('button', { name: 'Toggle Dark Mode' }),
    screen.getByRole('button', { name: 'Toggle Menu' }),
    screen.getByRole('button', { name: 'Close Menu' }),
  ]

  controls.forEach((control) => {
    expect(control).toHaveClass(
      'h-8',
      'w-8',
      'border',
      'border-transparent',
      'text-tertiary',
      'hover:border-primary-container',
      'hover:bg-surface-container-low',
      'dark:hover:bg-[#383d40]'
    )
  })
})

it('uses the semantic mobile overlay, dividers, and link typography', () => {
  render(<Header />)

  const closeButton = screen.getByRole('button', { name: 'Close Menu' })
  const overlay = closeButton.closest('.fixed')

  expect(overlay).toHaveClass('bg-surface/95', 'dark:bg-inverse-surface/95')
  expect(within(overlay as HTMLElement).getByRole('link', { name: 'Blog' })).toHaveClass(
    'border-outline-variant',
    'dark:border-outline',
    'text-headline-md'
  )

  fireEvent.click(screen.getByRole('button', { name: 'Toggle Menu' }))
  expect(document.body.style.overflow).toBe('hidden')
  expect(overlay).toHaveClass('translate-x-0')

  fireEvent.click(closeButton)
  expect(document.body.style.overflow).toBe('auto')
})

it('renders the actual theme control without changing its behavior', () => {
  render(<Header />)

  fireEvent.click(screen.getByRole('button', { name: 'Toggle Dark Mode' }))
  expect(setTheme).toHaveBeenCalledWith('dark')
})

it('uses the semantic footer divider, label typography, and social control', () => {
  render(<Footer />)

  expect(screen.getByRole('contentinfo')).toHaveClass('border-outline-variant')
  expect(screen.getByText(/©/)).toHaveClass('text-label-sm', 'uppercase', 'text-tertiary')
  expect(screen.getByRole('link', { name: 'mail' })).toHaveClass(
    'h-8',
    'w-8',
    'border-transparent',
    'hover:border-primary-container'
  )
})

it('renders the actual semantic search control', () => {
  render(<SearchButton />)

  const searchButton = screen.getByRole('button', { name: 'Search' })
  expect(searchButton.firstElementChild).toHaveClass(
    'h-8',
    'w-8',
    'border',
    'border-transparent',
    'text-tertiary',
    'hover:border-primary-container',
    'hover:bg-surface-container-low'
  )
})

it('uses statically discoverable classes for supported social icon sizes', () => {
  const source = readFileSync(
    join(process.cwd(), 'components', 'social-icons', 'index.tsx'),
    'utf8'
  )

  expect(source).toMatch(/5:\s*'h-5 w-5 fill-current'/)
  expect(source).toMatch(/8:\s*'h-8 w-8 fill-current'/)
  expect(source).not.toContain('h-${size}')
})

it('renders size 5 and the default size 8 social icon classes', () => {
  render(
    <>
      <SocialIcon kind="github" href="https://github.com/example" size={5} />
      <SocialIcon kind="twitter" href="https://twitter.com/example" />
    </>
  )

  expect(screen.getByRole('link', { name: 'github' }).querySelector('svg')).toHaveClass(
    'h-5',
    'w-5',
    'fill-current'
  )
  expect(screen.getByRole('link', { name: 'twitter' }).querySelector('svg')).toHaveClass(
    'h-8',
    'w-8',
    'fill-current'
  )
})

import { cleanup, render, screen, within } from '@testing-library/react'
import Home from '../app/Main'
import NotFound from '../app/not-found'
import ListLayout from '@/layouts/ListLayout'
import ListLayoutWithTags from '@/layouts/ListLayoutWithTags'

const colors = require('../tailwind.config').theme.extend.colors

function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const channels = hex
      .slice(1)
      .match(/.{2}/g)!
      .map((value) => parseInt(value, 16) / 255)
      .map((value) => (value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)))
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  }
  const lighter = Math.max(luminance(foreground), luminance(background))
  const darker = Math.min(luminance(foreground), luminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

let pathname = '/blog'

jest.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

jest.mock('@/data/siteMetadata', () => ({
  __esModule: true,
  default: { locale: 'en-US' },
}))

jest.mock('pliny/ui/NewsletterForm', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('pliny/utils/formatDate', () => ({
  formatDate: (date: string) => date,
}))

jest.mock('github-slugger', () => ({
  slug: (value: string) => value.toLowerCase().replaceAll(' ', '-'),
}))

jest.mock('app/tag-data.json', () => ({ alpha: 2, beta: 1 }), { virtual: true })

const homePosts = [
  { slug: 'first', date: '2026-01-02', title: 'First', tags: ['alpha'] },
  { slug: 'second', date: '2026-01-01', title: 'Second', tags: ['beta'] },
]

const layoutPosts = [
  {
    path: 'blog/first',
    date: '2026-01-02',
    title: 'First',
    summary: 'First summary',
    tags: ['alpha'],
  },
  {
    path: 'blog/second',
    date: '2026-01-01',
    title: 'Second',
    summary: 'Second summary',
    tags: ['beta'],
  },
]

const postLists = [
  ['home', () => <Home posts={homePosts} />],
  ['standard layout', () => <ListLayout posts={layoutPosts as never} title="Posts" />],
  ['tag layout', () => <ListLayoutWithTags posts={layoutPosts as never} title="Posts by tag" />],
] as const

afterEach(() => {
  cleanup()
  pathname = '/blog'
})

it.each(postLists)(
  'applies alternating surfaces to sibling rows in the %s post list',
  (_, view) => {
    render(view())

    const rows = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveClass('odd:bg-surface-container-lowest')
    expect(rows[1]).toHaveClass('even:bg-surface-container-low')

    rows.forEach((row) => {
      const link = within(row).getByRole('link')
      expect(link).toHaveClass('flex', 'items-baseline', 'hover:bg-surface-container')
      expect(link).not.toHaveClass(
        'odd:bg-surface-container-lowest',
        'even:bg-surface-container-low'
      )
    })
  }
)

it('insets links in the home Latest list', () => {
  render(<Home posts={homePosts} />)

  const rows = within(screen.getByRole('list')).getAllByRole('listitem')
  rows.forEach((row) => {
    const link = within(row).getByRole('link')
    expect(link).toHaveClass('px-2')
    expect(link).not.toHaveClass('-mx-2')
  })
})

it('insets links in the shared blog and tag list', () => {
  render(<ListLayoutWithTags posts={layoutPosts as never} title="Posts" />)

  const rows = within(screen.getByRole('list')).getAllByRole('listitem')
  rows.forEach((row) => {
    const link = within(row).getByRole('link')
    expect(link).toHaveClass('px-2')
    expect(link).not.toHaveClass('-mx-2')
  })
})

it.each([
  ['home', () => <Home posts={[]} />],
  ['standard layout', () => <ListLayout posts={[]} title="Posts" />],
] as const)('renders the %s empty state as a list item', (_, view) => {
  render(view())

  const emptyState = screen.getByText('No posts found.')
  expect(emptyState).toHaveClass('text-body-md', 'text-tertiary')
  expect(emptyState.tagName).toBe('LI')
  expect(emptyState.parentElement).toBe(screen.getByRole('list'))
})

it('allows the global focus-visible outline on the 404 action', () => {
  render(<NotFound />)

  expect(screen.getByRole('link', { name: 'Back to homepage' }).className).not.toMatch(
    /(?:focus|focus-visible):outline-none/
  )
})

it('uses a defined Clinical Precision role for the 404 message', () => {
  render(<NotFound />)

  const message = screen.getByText("Sorry we couldn't find this page.")
  expect(message).toHaveClass('text-headline-md')
  expect(message).not.toHaveClass('text-title-lg', 'md:text-headline-sm')
})

it('uses a valid explicit desktop line-height for the 404 heading', () => {
  render(<NotFound />)

  const heading = screen.getByRole('heading', { level: 1, name: '404' })
  expect(heading).toHaveClass('md:leading-[1]')
  expect(heading).not.toHaveClass('md:leading-14')
})

it('uses the accessible primary-container token pair for filled light controls', () => {
  const expectedClasses = ['bg-primary-container', 'text-on-primary-container']
  expect(colors['primary-container']).toBe('#f87171')
  expect(colors['on-primary-container']).toBe('#6c0513')
  expect(
    contrastRatio(colors['on-primary-container'], colors['primary-container'])
  ).toBeGreaterThanOrEqual(4.5)

  render(<NotFound />)
  expect(screen.getByRole('link', { name: 'Back to homepage' })).toHaveClass(
    ...expectedClasses,
    'hover:bg-primary',
    'hover:text-on-primary'
  )
  expect(contrastRatio(colors['on-primary'], colors.primary.DEFAULT)).toBeGreaterThanOrEqual(4.5)
  cleanup()

  render(<ListLayoutWithTags posts={layoutPosts as never} title="Posts" />)
  expect(screen.getByRole('link', { name: 'All' })).toHaveClass(...expectedClasses)
  cleanup()

  pathname = '/tags/alpha'
  render(<ListLayoutWithTags posts={layoutPosts as never} title="Posts" />)
  expect(screen.getByRole('link', { name: 'View posts tagged alpha' })).toHaveClass(
    ...expectedClasses
  )
})

it('marks only the All filter as current on the unfiltered blog route', () => {
  render(<ListLayoutWithTags posts={layoutPosts as never} title="Posts" />)

  expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'View posts tagged alpha' })).not.toHaveAttribute(
    'aria-current'
  )
  expect(screen.getByRole('link', { name: 'View posts tagged beta' })).not.toHaveAttribute(
    'aria-current'
  )
})

it('marks only the selected tag filter as current', () => {
  pathname = '/tags/alpha'
  render(<ListLayoutWithTags posts={layoutPosts as never} title="Posts" />)

  expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current')
  expect(screen.getByRole('link', { name: 'View posts tagged alpha' })).toHaveAttribute(
    'aria-current',
    'page'
  )
  expect(screen.getByRole('link', { name: 'View posts tagged beta' })).not.toHaveAttribute(
    'aria-current'
  )
})

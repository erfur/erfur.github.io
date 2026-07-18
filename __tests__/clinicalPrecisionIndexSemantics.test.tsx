import { cleanup, render, screen, within } from '@testing-library/react'
import Home from '../app/Main'
import NotFound from '../app/not-found'
import ListLayout from '@/layouts/ListLayout'
import ListLayoutWithTags from '@/layouts/ListLayoutWithTags'

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

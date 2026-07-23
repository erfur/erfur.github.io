import { render, screen } from '@testing-library/react'
import PostLayout from '@/layouts/PostLayout'

const mockPostBanner = jest.fn(({ src, alt }: { src: string; alt: string }) => (
  <div data-testid="post-banner" data-src={src} data-alt={alt} />
))

jest.mock('@/components/PostBanner', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string }) => mockPostBanner(props),
}))

jest.mock('@/components/ScrollTopAndComment', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/Comments', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/TableOfContents', () => ({
  TableOfContentsMobile: () => null,
  TableOfContentsDesktop: () => null,
}))

const baseContent = {
  slug: 'example-post',
  date: '2026-06-27',
  title: 'Example Post',
  tags: [],
}

beforeEach(() => {
  mockPostBanner.mockClear()
})

it('renders the first image as the post banner', () => {
  render(
    <PostLayout
      content={
        {
          ...baseContent,
          images: ['/static/images/example/banner.jpg', '/static/images/example/other.jpg'],
        } as never
      }
      authorDetails={[]}
    >
      <p>body</p>
    </PostLayout>
  )

  const banner = screen.getByTestId('post-banner')
  expect(banner).toHaveAttribute('data-src', '/static/images/example/banner.jpg')
  expect(banner).toHaveAttribute('data-alt', 'Example Post')
  expect(mockPostBanner).toHaveBeenCalledTimes(1)
})

it('does not render a post banner without images', () => {
  render(
    <PostLayout content={baseContent as never} authorDetails={[]}>
      <p>body</p>
    </PostLayout>
  )

  expect(screen.queryByTestId('post-banner')).not.toBeInTheDocument()
  expect(mockPostBanner).not.toHaveBeenCalled()
})

it('does not mount a post banner when images is empty', () => {
  render(
    <PostLayout content={{ ...baseContent, images: [] } as never} authorDetails={[]}>
      <p>body</p>
    </PostLayout>
  )

  expect(screen.queryByTestId('post-banner')).not.toBeInTheDocument()
  expect(mockPostBanner).not.toHaveBeenCalled()
})

it('does not mount a post banner when images is not an array', () => {
  render(
    <PostLayout
      content={{ ...baseContent, images: '/static/images/example/banner.jpg' } as never}
      authorDetails={[]}
    >
      <p>body</p>
    </PostLayout>
  )

  expect(screen.queryByTestId('post-banner')).not.toBeInTheDocument()
  expect(mockPostBanner).not.toHaveBeenCalled()
})

it('uses scoped Merriweather post body typography', () => {
  render(
    <PostLayout content={baseContent as never} authorDetails={[]}>
      <p>body</p>
    </PostLayout>
  )

  expect(screen.getByText('body').parentElement).toHaveClass('prose', 'prose-post', 'max-w-none')
  expect(screen.getByText('body').parentElement).not.toHaveClass('prose-gray')
})

it('gives the post title more size and space before the body', () => {
  render(
    <PostLayout content={baseContent as never} authorDetails={[]}>
      <p>body</p>
    </PostLayout>
  )

  const title = screen.getByRole('heading', { level: 1, name: 'Example Post' })
  expect(title).toHaveClass(
    'text-[1.75rem]',
    'leading-[2.25rem]',
    'font-bold',
    'tracking-[-0.02em]',
    'sm:text-[2.25rem]',
    'sm:leading-[2.75rem]'
  )
  expect(title).not.toHaveClass('text-headline-lg-mobile', 'sm:text-headline-lg')
  expect(title.closest('header')).toHaveClass('pb-10', 'pt-4')
})

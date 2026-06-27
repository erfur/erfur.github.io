import { render, screen } from '@testing-library/react'
import PostLayout from '@/layouts/PostLayout'

jest.mock('@/components/PostBanner', () => ({
  __esModule: true,
  default: ({ src, alt }: { src?: string; alt: string }) =>
    src ? <div data-testid="post-banner" data-src={src} data-alt={alt} /> : null,
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

it('renders the first image as the post banner', () => {
  render(
    <PostLayout
      content={{
        ...baseContent,
        images: ['/static/images/example/banner.jpg', '/static/images/example/other.jpg'],
      } as never}
      authorDetails={[]}
    >
      <p>body</p>
    </PostLayout>
  )

  const banner = screen.getByTestId('post-banner')
  expect(banner).toHaveAttribute('data-src', '/static/images/example/banner.jpg')
  expect(banner).toHaveAttribute('data-alt', 'Example Post')
})

it('does not render a post banner without images', () => {
  render(
    <PostLayout content={baseContent as never} authorDetails={[]}>
      <p>body</p>
    </PostLayout>
  )

  expect(screen.queryByTestId('post-banner')).not.toBeInTheDocument()
})

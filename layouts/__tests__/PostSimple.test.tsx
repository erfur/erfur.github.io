import { render, screen } from '@testing-library/react'
import PostSimple from '@/layouts/PostSimple'

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

jest.mock('pliny/utils/formatDate', () => ({
  formatDate: (date: string) => date,
}))

const baseContent = {
  slug: 'example-post',
  date: '2026-06-27',
  title: 'Example Post',
}

beforeEach(() => {
  mockPostBanner.mockClear()
})

it('renders the first image as the post banner', () => {
  render(
    <PostSimple
      content={
        {
          ...baseContent,
          images: ['/static/images/example/banner.jpg', '/static/images/example/other.jpg'],
        } as never
      }
    >
      <p>body</p>
    </PostSimple>
  )

  const banner = screen.getByTestId('post-banner')
  expect(banner).toHaveAttribute('data-src', '/static/images/example/banner.jpg')
  expect(banner).toHaveAttribute('data-alt', 'Example Post')
  expect(mockPostBanner).toHaveBeenCalledTimes(1)
})

it('does not render a post banner without images', () => {
  render(
    <PostSimple content={baseContent as never}>
      <p>body</p>
    </PostSimple>
  )

  expect(screen.queryByTestId('post-banner')).not.toBeInTheDocument()
  expect(mockPostBanner).not.toHaveBeenCalled()
})

it('does not mount a post banner when images is empty', () => {
  render(
    <PostSimple content={{ ...baseContent, images: [] } as never}>
      <p>body</p>
    </PostSimple>
  )

  expect(screen.queryByTestId('post-banner')).not.toBeInTheDocument()
  expect(mockPostBanner).not.toHaveBeenCalled()
})

it('does not mount a post banner when images is not an array', () => {
  render(
    <PostSimple content={{ ...baseContent, images: '/static/images/example/banner.jpg' } as never}>
      <p>body</p>
    </PostSimple>
  )

  expect(screen.queryByTestId('post-banner')).not.toBeInTheDocument()
  expect(mockPostBanner).not.toHaveBeenCalled()
})

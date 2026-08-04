import { render, screen } from '@testing-library/react'
import PostBanner from '@/components/PostBanner'

it('renders the banner image when a source is provided', () => {
  render(<PostBanner src="/static/images/example/banner.jpg" alt="Example post" />)

  const banner = screen.getByTestId('post-banner')
  const image = screen.getByAltText('Example post')

  expect(banner).toBeInTheDocument()
  expect(banner).toHaveClass('w-screen', 'h-[calc(46svh-5rem)]')
  expect(banner).not.toHaveClass('border', 'rounded-2xl', 'shadow-sm')
  expect(image).toHaveAttribute('src', expect.stringContaining('/static/images/example/banner.jpg'))
})

it('keeps banner content above the body on mobile and positions it at 40 percent on desktop', () => {
  render(
    <PostBanner src="/static/images/example/banner.jpg" alt="Example post">
      <h1>Example post</h1>
    </PostBanner>
  )

  expect(screen.getByRole('heading')).toHaveTextContent('Example post')
  expect(screen.getByRole('heading').parentElement).toHaveClass(
    'bottom-4',
    'md:bottom-auto',
    'md:top-[calc(40svh-5rem)]',
    'md:-translate-y-1/2',
    'px-8',
    'sm:px-12',
    'xl:px-0'
  )
})

it('renders nothing without a source', () => {
  render(<PostBanner src={undefined} alt="Example post" />)

  expect(screen.queryByTestId('post-banner')).not.toBeInTheDocument()
})

it('does not fade the banner as the user scrolls', () => {
  render(<PostBanner src="/static/images/example/banner.jpg" alt="Example post" />)

  expect(screen.getByTestId('post-banner')).not.toHaveAttribute('style')
})

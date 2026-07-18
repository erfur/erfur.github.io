import { act, render, screen } from '@testing-library/react'
import PostBanner from '@/components/PostBanner'

const originalRequestAnimationFrame = window.requestAnimationFrame
const originalCancelAnimationFrame = window.cancelAnimationFrame
const originalMatchMedia = window.matchMedia

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    writable: true,
    value,
  })
}

function setReducedMotion(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
}

beforeEach(() => {
  setScrollY(0)
  window.requestAnimationFrame = (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  }
  window.cancelAnimationFrame = jest.fn()
  setReducedMotion(false)
})

afterEach(() => {
  window.requestAnimationFrame = originalRequestAnimationFrame
  window.cancelAnimationFrame = originalCancelAnimationFrame
  window.matchMedia = originalMatchMedia
})

it('renders the banner image when a source is provided', () => {
  render(<PostBanner src="/static/images/example/banner.jpg" alt="Example post" />)

  const banner = screen.getByTestId('post-banner')
  const image = screen.getByAltText('Example post')

  expect(banner).toBeInTheDocument()
  expect(banner).toHaveClass('border', 'border-outline-variant')
  expect(banner).not.toHaveClass('rounded-2xl', 'shadow-sm')
  expect(image).toHaveAttribute('src', expect.stringContaining('/static/images/example/banner.jpg'))
})

it('renders nothing without a source', () => {
  render(<PostBanner src={undefined} alt="Example post" />)

  expect(screen.queryByTestId('post-banner')).not.toBeInTheDocument()
})

it('fades as the user scrolls down', () => {
  render(<PostBanner src="/static/images/example/banner.jpg" alt="Example post" />)

  const banner = screen.getByTestId('post-banner')
  expect(banner).toHaveStyle({ opacity: '1' })

  act(() => {
    setScrollY(144)
    window.dispatchEvent(new Event('scroll'))
  })

  expect(Number(banner.style.opacity)).toBeLessThan(1)
  expect(Number(banner.style.opacity)).toBeGreaterThan(0)

  act(() => {
    setScrollY(320)
    window.dispatchEvent(new Event('scroll'))
  })

  expect(banner).toHaveStyle({ opacity: '0' })
})

it('stays fully visible when reduced motion is preferred', () => {
  setReducedMotion(true)
  render(<PostBanner src="/static/images/example/banner.jpg" alt="Example post" />)

  const banner = screen.getByTestId('post-banner')

  act(() => {
    setScrollY(320)
    window.dispatchEvent(new Event('scroll'))
  })

  expect(banner).toHaveStyle({ opacity: '1' })
})

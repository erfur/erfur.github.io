import { render, screen } from '@testing-library/react'
import PostBanner from '@/layouts/PostBanner'

jest.mock('@/components/ScrollTopAndComment', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/Comments', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('pliny/ui/Bleed', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}))

const content = {
  slug: 'example-post',
  title: 'Example Post',
  images: ['/static/images/example/banner.jpg'],
}

it('opts post prose into the post body typography modifier', () => {
  render(
    <PostBanner content={content as never}>
      <p>body</p>
    </PostBanner>
  )

  expect(screen.getByText('body').parentElement).toHaveClass('prose-post')
})

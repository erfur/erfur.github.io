import { render, screen } from '@testing-library/react'
import AuthorLayout from '@/layouts/AuthorLayout'

jest.mock('@/components/social-icons', () => ({
  __esModule: true,
  default: () => null,
}))

it('uses the configured headline role for the author name', () => {
  render(
    <AuthorLayout content={{ name: 'Example Author' } as never}>
      <p>Biography</p>
    </AuthorLayout>
  )

  const authorName = screen.getByRole('heading', { level: 2, name: 'Example Author' })
  expect(authorName).toHaveClass('text-headline-md')
  expect(authorName).not.toHaveClass('text-title-lg')
})

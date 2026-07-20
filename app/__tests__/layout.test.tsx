jest.mock('next/font/google', () => ({
  JetBrains_Mono: jest.fn(() => ({ variable: 'jetbrains-mono-variable' })),
  Merriweather: jest.fn(() => ({ variable: 'merriweather-variable' })),
}))

jest.mock('@/components/Header', () => () => null)
jest.mock('@/components/Footer', () => () => null)
jest.mock(
  '@/components/SectionContainer',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
)
jest.mock('pliny/analytics', () => ({ Analytics: () => null }))
jest.mock('pliny/search', () => ({
  SearchProvider: ({ children }: { children: React.ReactNode }) => children,
}))
jest.mock('../theme-providers', () => ({
  ThemeProviders: ({ children }: { children: React.ReactNode }) => children,
}))

import { JetBrains_Mono, Merriweather } from 'next/font/google'
import '../layout'

it('avoids flashing fallback interface text while post prose can swap', () => {
  expect(JetBrains_Mono).toHaveBeenCalledWith({
    subsets: ['latin'],
    display: 'block',
    variable: '--font-jetbrains-mono',
    weight: ['400', '500', '600', '700'],
  })
  expect(Merriweather).toHaveBeenCalledWith({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-merriweather',
    weight: ['400', '700'],
    style: ['normal', 'italic'],
  })
})

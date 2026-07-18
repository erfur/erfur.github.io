jest.mock('next/font/google', () => ({
  Roboto: jest.fn(() => ({ variable: 'roboto-variable' })),
  Roboto_Slab: jest.fn(() => ({ variable: 'roboto-slab-variable' })),
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

import { Merriweather } from 'next/font/google'
import '../layout'

it('loads the post body font with normal and italic 400 and 700 variants', () => {
  expect(Merriweather).toHaveBeenCalledWith({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-merriweather',
    weight: ['400', '700'],
    style: ['normal', 'italic'],
  })
})

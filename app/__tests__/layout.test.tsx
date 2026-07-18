jest.mock('next/font/google', () => ({
  JetBrains_Mono: jest.fn(() => ({ variable: 'jetbrains-mono-variable' })),
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

import { JetBrains_Mono } from 'next/font/google'
import '../layout'

it('loads JetBrains Mono as the only site typeface', () => {
  expect(JetBrains_Mono).toHaveBeenCalledWith({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-jetbrains-mono',
    weight: ['400', '500', '600', '700'],
  })
})

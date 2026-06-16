// Adds custom jest matchers like toBeInTheDocument(), toHaveAttribute(), etc.
import '@testing-library/jest-dom'

// jsdom doesn't implement matchMedia; provide a minimal mock so responsive
// components (e.g. popovers that branch on `min-width`) can render in tests.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})

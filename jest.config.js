const nextJest = require('next/jest')

// Provide the path to the Next.js app to load next.config.js and .env files in the test environment.
const createJestConfig = nextJest({ dir: './' })

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  // Mirror the tsconfig path aliases so `@/...` imports resolve in tests.
  // (next/jest keeps its own CSS/image/font mocks; these only add the aliases.)
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/data/(.*)$': '<rootDir>/data/$1',
    '^@/layouts/(.*)$': '<rootDir>/layouts/$1',
    '^@/css/(.*)$': '<rootDir>/css/$1',
    '^contentlayer/generated$': '<rootDir>/.contentlayer/generated',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/.yarn/'],
}

module.exports = createJestConfig(customJestConfig)

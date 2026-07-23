const packageJson = require('../package.json')

test('Jest scripts force the test environment', () => {
  expect(packageJson.scripts.test).toBe('cross-env NODE_ENV=test jest --watch')
  expect(packageJson.scripts['test:run']).toBe('cross-env NODE_ENV=test jest')
})

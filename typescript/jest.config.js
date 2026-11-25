/** @type {import('jest').Config} */
const project = (displayName, overrides) => ({
  displayName,
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/src/tests/**/*.test.ts'],
  ...overrides,
})

module.exports = {
  projects: [
    project('unit', { testPathIgnorePatterns: ['/node_modules/', '/src/tests/integration/'] }),
    project('integration', { testMatch: ['**/src/tests/integration/**/*.test.ts'] }),
  ],
}

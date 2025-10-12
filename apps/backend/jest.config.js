/**
 * Jest Configuration for Backend Integration Tests
 */

module.exports = {
  displayName: 'backend',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/backend',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globalTeardown: '<rootDir>/tests/teardown.ts',
  maxWorkers: 1, // Run tests serially to avoid database connection issues
  forceExit: false, // Don't force exit - let connections close properly
  detectOpenHandles: false, // Disable for faster runs
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/main-with-monitoring.ts',
    '!src/test-connection.ts',
    '!src/db/migrate.ts',
    '!src/db/seed.ts',
    '!src/db/verify-schema.ts',
    '!src/config/**',
    '!src/middleware/examples/**',
    '!src/storage/test-s3.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

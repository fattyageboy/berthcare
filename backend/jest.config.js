/**
 * Jest Configuration
 * Configuration for unit and integration testing
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/services/user/auth.service.ts',
    'src/services/user/auth0.service.ts',
    'src/services/user/device.service.ts',
    'src/shared/middleware/auth.ts',
    'src/shared/middleware/rbac.ts',
    'src/shared/utils/jwt.utils.ts',
    'src/services/file-upload/upload.controller.ts',
    'src/services/file-upload/photo.service.ts',
    'src/services/file-upload/s3.service.ts',
    'src/services/file-upload/multer.config.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'], // Uncomment if setup file needed
  testTimeout: 10000,
  verbose: true,
};

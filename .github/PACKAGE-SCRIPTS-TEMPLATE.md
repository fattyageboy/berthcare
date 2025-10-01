# Required npm Scripts for CI Pipeline

This document outlines the npm scripts required for the CI pipeline to function correctly.

## Required Scripts in package.json

Add these scripts to your `package.json` file:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0 --format json --output-file eslint-report.json || eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "type-check": "tsc --noEmit --pretty > tsc-output.txt || (cat tsc-output.txt && exit 1)",
    "test:unit": "jest --testPathPattern='\\.(test|spec)\\.(ts|tsx)$'",
    "test:unit:watch": "jest --watch",
    "test:unit:coverage": "jest --coverage --testPathPattern='\\.(test|spec)\\.(ts|tsx)$'",
    "test:integration": "jest --testPathPattern='integration'",
    "test:all": "npm run lint && npm run type-check && npm run test:unit"
  }
}
```

## Script Explanations

### lint
- Runs ESLint on all TypeScript and JavaScript files
- Fails if any warnings or errors are found (`--max-warnings 0`)
- Outputs JSON report for artifact upload
- Falls back to standard output for readability

### lint:fix
- Automatically fixes fixable linting issues
- Useful for local development

### type-check
- Runs TypeScript compiler in type-check only mode (no emit)
- Outputs to file for artifact upload
- Fails if any type errors are found

### test:unit
- Runs unit tests using Jest
- Filters for test files with `.test.` or `.spec.` extensions
- Uses the `--ci` flag in CI environment for appropriate output

### test:unit:watch
- Runs tests in watch mode for local development
- Automatically re-runs tests when files change

### test:unit:coverage
- Runs tests with coverage collection
- Generates coverage reports in multiple formats
- Required for SonarQube integration

### test:integration
- Runs integration tests separately
- Useful for tests that require database or external services

### test:all
- Convenience script to run all checks locally
- Simulates CI pipeline checks

## Required Dependencies

Install these development dependencies:

```bash
# TypeScript and type checking
npm install --save-dev typescript @types/node @types/jest

# ESLint and plugins
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev eslint-plugin-react eslint-plugin-react-hooks

# Jest and testing utilities
npm install --save-dev jest ts-jest @types/jest
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event

# Coverage and reporting
npm install --save-dev jest-junit
```

## Configuration Files

### ESLint Configuration

Create `.eslintrc.json`:

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    },
    "project": "./tsconfig.json"
  },
  "plugins": [
    "@typescript-eslint",
    "react",
    "react-hooks"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "env": {
    "browser": true,
    "node": true,
    "es2022": true,
    "jest": true
  },
  "ignorePatterns": [
    "dist",
    "build",
    "node_modules",
    "coverage",
    "*.config.js",
    "*.config.ts"
  ]
}
```

### TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowJs": false,
    "checkJs": false,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": true,
    "noEmit": false,
    "importHelpers": true,
    "downlevelIteration": true,
    "isolatedModules": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "coverage",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx"
  ]
}
```

### Jest Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/.vscode/',
    '/.github/',
  ],
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'json-summary',
    'html'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
  testTimeout: 10000,
  verbose: true,
};
```

### SonarQube Project Configuration

Create `sonar-project.properties` in project root:

```properties
# Project identification
sonar.projectKey=berthcare
sonar.projectName=BerthCare
sonar.projectVersion=1.0.0

# Source code
sonar.sources=src
sonar.sourceEncoding=UTF-8

# Test files
sonar.tests=src
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx

# Coverage
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.lcov.reportPaths=coverage/lcov.info

# Exclusions for coverage and duplication
sonar.coverage.exclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,**/*.config.js,**/*.config.ts,**/setupTests.ts,**/reportWebVitals.ts,**/index.tsx
sonar.cpd.exclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx

# Exclusions for analysis
sonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,**/*.config.js,**/*.config.ts

# Quality gate
sonar.qualitygate.wait=true
sonar.qualitygate.timeout=300

# Analysis parameters
sonar.scm.provider=git
```

## Testing the Configuration

### Local Testing

Before pushing to CI, test scripts locally:

```bash
# Test linting
npm run lint

# Test type checking
npm run type-check

# Test unit tests
npm run test:unit

# Test coverage
npm run test:unit:coverage

# Run all checks
npm run test:all
```

### Mock Test Files

Create sample test files to verify Jest configuration:

**src/components/Button.test.tsx:**

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**src/setupTests.ts:**

```typescript
import '@testing-library/jest-dom';

// Global test setup
beforeAll(() => {
  // Setup code before all tests
});

afterAll(() => {
  // Cleanup code after all tests
});
```

## Troubleshooting

### Common Issues

**ESLint not finding TypeScript files:**
- Ensure `@typescript-eslint/parser` is installed
- Check `tsconfig.json` is in project root
- Verify file extensions in lint script

**Type check fails:**
- Run `npx tsc --noEmit` to see detailed errors
- Check `tsconfig.json` configuration
- Ensure all `@types/*` packages are installed

**Jest can't find tests:**
- Check `testMatch` patterns in `jest.config.js`
- Ensure test files follow naming convention
- Verify `roots` configuration

**Coverage thresholds not met:**
- Review uncovered files with `npm run test:unit:coverage`
- Open `coverage/lcov-report/index.html` in browser
- Write tests for uncovered code or adjust thresholds

## Integration with CI

These scripts are used by the CI pipeline in the following jobs:

| CI Job | Script Used |
|--------|-------------|
| Code Quality | `npm run lint` & `npm run type-check` |
| Unit Tests | `npm run test:unit -- --coverage --ci` |
| SonarQube | Uses coverage output from tests |

All scripts must exit with code 0 for CI to pass.

---

**Last Updated:** 2025-09-30

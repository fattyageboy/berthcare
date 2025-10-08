# CI/CD Pipeline Setup

## Overview

This document describes the Continuous Integration (CI) pipeline configured for the BerthCare project as part of task E2 from the implementation plan.

## Pipeline Configuration

The CI pipeline is implemented using GitHub Actions and runs automatically on all pull requests to the `main` branch.

### Pipeline Jobs

The CI pipeline consists of the following jobs that run in parallel:

#### 1. Lint & Format Check
- **Purpose**: Ensures code quality and consistent formatting
- **Tools**: ESLint, Prettier
- **Commands**:
  - `npm run lint` - Runs ESLint with zero warnings policy
  - `npm run format:check` - Verifies Prettier formatting

#### 2. TypeScript Type Check
- **Purpose**: Validates TypeScript types across the codebase
- **Tool**: TypeScript Compiler (tsc)
- **Command**: `npm run type-check`

#### 3. Unit Tests (Jest)
- **Purpose**: Runs all unit tests with coverage reporting
- **Tool**: Jest
- **Command**: `npm test -- --coverage --ci`
- **Coverage**: Results uploaded to Codecov (optional)
- **Threshold**: 80% coverage required (configured in jest.config.js)

#### 4. Security Scan (SAST)
- **Purpose**: Static Application Security Testing
- **Tool**: Snyk
- **Configuration**: Fails on high severity vulnerabilities
- **Output**: Results uploaded to GitHub Code Scanning

#### 5. Dependency Audit
- **Purpose**: Checks for known vulnerabilities in dependencies
- **Tool**: npm audit
- **Threshold**: Moderate severity and above

#### 6. All Checks Complete
- **Purpose**: Final gate that requires all previous jobs to pass
- **Behavior**: Fails if any required check fails

## Branch Protection Rules

To enforce CI requirements, configure the following branch protection rules on the `main` branch:

1. **Require pull request reviews before merging**: 1+ approvals
2. **Require status checks to pass before merging**: Enable all CI jobs
3. **Require branches to be up to date before merging**: Enabled
4. **Require signed commits**: Recommended for security

### Required Status Checks
- Lint & Format Check
- TypeScript Type Check
- Unit Tests (Jest)
- Security Scan (SAST)
- Dependency Audit
- All CI Checks Passed

## Required Secrets

Configure the following secrets in GitHub repository settings:

### Required
- None (basic pipeline works without secrets)

### Optional (for enhanced features)
- `CODECOV_TOKEN` - For coverage reporting to Codecov
- `SNYK_TOKEN` - For Snyk security scanning

## Local Development

### Running CI Checks Locally

Before pushing code, run these commands locally to catch issues early:

```bash
# Install dependencies
npm ci

# Run all checks
npm run lint
npm run format:check
npm run type-check
npm test

# Fix formatting issues
npm run format

# Run security audit
npm audit
```

### Pre-commit Hook (Recommended)

Consider setting up a pre-commit hook using Husky to run checks automatically:

```bash
npm install --save-dev husky lint-staged
npx husky install
```

## Configuration Files

### ESLint (.eslintrc.json)
- TypeScript support enabled
- React and React Hooks plugins configured
- Prettier integration for consistent formatting
- Strict rules for code quality

### Prettier (.prettierrc.json)
- Single quotes
- 2-space indentation
- 100 character line width
- Trailing commas (ES5)
- LF line endings

### TypeScript (tsconfig.json)
- Strict mode enabled
- ES2022 target
- CommonJS modules
- No unused locals/parameters
- Strict null checks

### Jest (jest.config.js)
- ts-jest preset for TypeScript support
- 80% coverage threshold
- Coverage reports in text, lcov, and json formats

## Troubleshooting

### CI Failing on Lint
```bash
# Check what's failing
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### CI Failing on Format
```bash
# Check formatting issues
npm run format:check

# Auto-fix formatting
npm run format
```

### CI Failing on Type Check
```bash
# Run type check locally
npm run type-check

# Check specific file
npx tsc --noEmit path/to/file.ts
```

### CI Failing on Tests
```bash
# Run tests locally
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- path/to/test.test.ts
```

### CI Failing on Security Scan
```bash
# Run npm audit locally
npm audit

# Fix automatically (if possible)
npm audit fix

# Review and fix manually
npm audit --json
```

## Performance Optimization

The CI pipeline is optimized for speed:

- **Parallel execution**: All jobs run simultaneously
- **Dependency caching**: npm dependencies cached between runs
- **Fail fast**: Jobs fail immediately on errors
- **Selective runs**: Only runs on PRs to main branch

## Next Steps

After E2 completion, the following enhancements are planned:

1. **E3**: Monorepo structure with Nx/Turborepo
2. **E5**: Production deployment pipeline
3. **E6**: Enhanced monitoring and observability
4. **Integration tests**: Add integration test job
5. **E2E tests**: Add end-to-end test job (later phases)

## References

- Architecture Blueprint: `project-documentation/architecture-output.md`
- Task Plan: `project-documentation/task-plan.md` (Task E2)
- GitHub Actions Docs: https://docs.github.com/en/actions
- Snyk Docs: https://docs.snyk.io/

# CI/CD Pipeline Setup Guide

## Overview

The BerthCare CI/CD pipeline is configured using GitHub Actions and runs automatically on all pull requests to the `main` branch. The pipeline ensures code quality, security, and reliability before any code is merged.

## Pipeline Jobs

### 1. Code Quality (Lint & Format)

- **ESLint**: Enforces code style and catches common errors
- **Prettier**: Ensures consistent code formatting
- **Timeout**: 10 minutes
- **Required**: Yes

### 2. TypeScript Type Check

- **TypeScript Compiler**: Validates type safety across the codebase
- **Timeout**: 10 minutes
- **Required**: Yes

### 3. Unit Tests

- **Jest**: Runs all unit tests with coverage reporting
- **Coverage Upload**: Sends coverage data to Codecov
- **Timeout**: 15 minutes
- **Required**: Yes
- **Coverage Threshold**: 70% (branches, functions, lines, statements)

### 4. Security Scan (SAST)

- **Snyk**: Scans for vulnerabilities in dependencies and code
- **CodeQL**: GitHub's semantic code analysis engine
- **Timeout**: 15 minutes
- **Required**: No (informational, doesn't block merge)

### 5. Dependency Audit

- **npm audit**: Checks for known security vulnerabilities in dependencies
- **Severity Threshold**: High and above
- **Timeout**: 10 minutes
- **Required**: Yes

### 6. Build Verification

- **Build**: Compiles all packages to ensure no build errors
- **Timeout**: 15 minutes
- **Required**: Yes

### 7. CI Summary

- **Status Check**: Aggregates all job results
- **Required**: Yes (fails if any required job fails)

## Required Secrets

Configure these secrets in GitHub repository settings:

### Optional (for enhanced features)

- `CODECOV_TOKEN`: For coverage reporting (get from codecov.io)
- `SNYK_TOKEN`: For Snyk security scanning (get from snyk.io)

### How to Add Secrets

1. Go to: https://github.com/fattyageboy/BerthCare/settings/secrets/actions
2. Click "New repository secret"
3. Add name and value
4. Click "Add secret"

## Branch Protection Rules

To enforce CI checks before merging, configure branch protection:

### Settings for `main` branch

1. Go to: https://github.com/fattyageboy/BerthCare/settings/branches
2. Add rule for `main` branch
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require conversation resolution before merging

### Required Status Checks

Add these checks as required:

- `Code Quality (Lint & Format)`
- `TypeScript Type Check`
- `Unit Tests`
- `Dependency Audit`
- `Build Verification`
- `CI Summary`

## Local Development

### Install Dependencies

```bash
npm install
```

### Run Checks Locally (Before Pushing)

```bash
# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Check code formatting
npm run format:check

# Format code automatically
npm run format

# Type check
npm run type-check

# Run tests
npm run test

# Run tests with coverage
npm run test:ci

# Build all packages
npm run build
```

### Pre-commit Hooks

The repository uses Husky for pre-commit hooks (optional):

```bash
# Install Husky
npm run prepare

# Hooks will run automatically on git commit
```

## Troubleshooting

### ESLint Errors

```bash
# See all errors
npm run lint

# Auto-fix where possible
npm run lint:fix
```

### Prettier Formatting

```bash
# Check formatting
npm run format:check

# Auto-format all files
npm run format
```

### TypeScript Errors

```bash
# Check types
npm run type-check

# Common issues:
# - Missing type definitions: npm install --save-dev @types/package-name
# - Path mapping issues: Check tsconfig.json paths
```

### Test Failures

```bash
# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- path/to/test.spec.ts

# Update snapshots
npm test -- -u
```

### Build Failures

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

## CI Performance

### Expected Run Times

- Code Quality: ~2-3 minutes
- Type Check: ~2-3 minutes
- Unit Tests: ~3-5 minutes
- Security SAST: ~5-10 minutes
- Dependency Audit: ~1-2 minutes
- Build Verification: ~3-5 minutes
- **Total**: ~15-25 minutes

### Optimization Tips

- Jobs run in parallel where possible
- Dependencies are cached between runs
- Concurrency cancels outdated runs
- Timeouts prevent hanging jobs

## Monitoring

### GitHub Actions Dashboard

- View runs: https://github.com/fattyageboy/BerthCare/actions
- Filter by workflow, branch, or status
- Download logs for debugging

### Coverage Reports

- View on Codecov: https://codecov.io/gh/fattyageboy/BerthCare
- Coverage trends over time
- File-level coverage details

### Security Alerts

- Dependabot alerts: https://github.com/fattyageboy/BerthCare/security/dependabot
- CodeQL alerts: https://github.com/fattyageboy/BerthCare/security/code-scanning
- Snyk dashboard: https://app.snyk.io

## Maintenance

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# Update specific package
npm update package-name

# Run audit after updates
npm audit
```

### Updating GitHub Actions

- Actions are pinned to major versions (e.g., `@v4`)
- Dependabot will create PRs for action updates
- Review and merge action updates regularly

## Support

For CI/CD issues:

1. Check GitHub Actions logs
2. Run checks locally to reproduce
3. Review this documentation
4. Create issue with logs and error messages

---

**Last Updated**: October 10, 2025  
**Maintained By**: DevOps Team

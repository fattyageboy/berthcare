# CI Pipeline Setup Guide

This guide provides step-by-step instructions for configuring the GitHub Actions CI pipeline for BerthCare.

## Overview

The CI pipeline enforces code quality gates before merging to `main`. It runs the following checks in parallel:

1. **Code Quality** - Lint checks (ESLint) and TypeScript type checking
2. **Unit Tests** - Automated test suite with coverage reporting
3. **SAST** - Static Application Security Testing using SonarQube
4. **Dependency Audit** - npm audit for known vulnerabilities
5. **Security Scanning** - Snyk for comprehensive dependency and code security

All checks must pass before a PR can be merged to `main`.

---

## Prerequisites

Before setting up the CI pipeline, ensure you have:

- GitHub repository with admin access
- SonarQube instance (cloud or self-hosted)
- Snyk account and API token
- Node.js project with appropriate npm scripts configured

---

## Part 1: Configure Required Secrets

### 1.1 SonarQube Configuration

#### For SonarQube Cloud:

1. Go to [SonarQube Cloud](https://sonarcloud.io/)
2. Create a new project or select existing project
3. Generate a token:
   - Navigate to **My Account** > **Security** > **Generate Tokens**
   - Name: `BerthCare-GitHub-Actions`
   - Type: `Global Analysis Token`
   - Expiration: `No expiration` or set appropriate timeframe
   - Copy the generated token

4. Add secrets to GitHub:
   - Go to your GitHub repository
   - Navigate to **Settings** > **Secrets and variables** > **Actions**
   - Click **New repository secret**
   - Add the following secrets:

   ```
   Secret Name: SONAR_TOKEN
   Value: [Your SonarQube token]

   Secret Name: SONAR_HOST_URL
   Value: https://sonarcloud.io (for cloud) or your self-hosted URL
   ```

#### For Self-Hosted SonarQube:

1. Access your SonarQube instance
2. Create a new project:
   - Project Key: `berthcare`
   - Display Name: `BerthCare`
3. Generate a token:
   - **Administration** > **Security** > **Users**
   - Select your user > **Tokens**
   - Generate token with appropriate permissions
4. Add to GitHub secrets (same as above, but use your self-hosted URL)

### 1.2 Snyk Configuration

1. Sign up or log in to [Snyk](https://app.snyk.io/)
2. Navigate to **Settings** > **General** > **Auth Token**
3. Copy your API token
4. Add to GitHub secrets:

   ```
   Secret Name: SNYK_TOKEN
   Value: [Your Snyk API token]
   ```

5. (Optional) Integrate Snyk with your GitHub repository:
   - In Snyk dashboard: **Integrations** > **GitHub**
   - Authorize and select BerthCare repository
   - This enables automated scanning on every commit

### 1.3 Verify Secrets Configuration

After adding secrets, verify they are configured:

1. Go to **Settings** > **Secrets and variables** > **Actions**
2. You should see:
   - `SONAR_TOKEN`
   - `SONAR_HOST_URL`
   - `SNYK_TOKEN`

---

## Part 2: Configure npm Scripts

Ensure your `package.json` includes the following scripts:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test:unit": "jest --testPathPattern='\\.(test|spec)\\.(ts|tsx)$'",
    "test:unit:coverage": "jest --coverage --testPathPattern='\\.(test|spec)\\.(ts|tsx)$'"
  }
}
```

### Required Configuration Files

#### ESLint Configuration (`.eslintrc.json` or `.eslintrc.js`):

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-module-boundary-types": "error"
  }
}
```

#### TypeScript Configuration (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

#### Jest Configuration (`jest.config.js`):

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### SonarQube Project Configuration (`sonar-project.properties`):

Create this file in your project root:

```properties
sonar.projectKey=berthcare
sonar.projectName=BerthCare
sonar.projectVersion=1.0

# Source and test directories
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx

# Coverage
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,**/*.config.js,**/*.config.ts

# Code duplication exclusions
sonar.cpd.exclusions=**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx

# Quality Gate thresholds
sonar.qualitygate.wait=true
```

---

## Part 3: Configure Branch Protection Rules

Branch protection rules ensure that all CI checks must pass before merging to `main`.

### 3.1 Enable Branch Protection

1. Go to your GitHub repository
2. Navigate to **Settings** > **Branches**
3. Under **Branch protection rules**, click **Add rule**

### 3.2 Configure Protection Settings

Configure the following settings for the `main` branch:

#### Branch name pattern:
```
main
```

#### Protect matching branches:

**Require a pull request before merging:**
- ✅ Enabled
- ✅ Require approvals: `1` (minimum, adjust based on team size)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from Code Owners (if using CODEOWNERS file)

**Require status checks to pass before merging:**
- ✅ Enabled
- ✅ Require branches to be up to date before merging

**Required status checks** (Select all of these):
- `Code Quality (Lint & Type Check)`
- `Unit Tests`
- `SAST (SonarQube)`
- `Dependency Audit (npm)`
- `Dependency Security (Snyk)`
- `CI Summary`

**Require conversation resolution before merging:**
- ✅ Enabled

**Require signed commits:**
- ⬜ Optional (recommended for enhanced security)

**Require linear history:**
- ✅ Enabled (prevents merge commits, enforces rebase or squash)

**Include administrators:**
- ✅ Enabled (applies rules to repo admins as well)

**Allow force pushes:**
- ⬜ Disabled

**Allow deletions:**
- ⬜ Disabled

### 3.3 Save and Verify

1. Click **Create** or **Save changes**
2. The branch protection rule is now active
3. Test by creating a PR - all checks must pass before merge button becomes available

---

## Part 4: Workflow Triggers and Behavior

### 4.1 When CI Runs

The CI pipeline is triggered on:
- **Pull Requests** targeting the `main` branch
- **Manual dispatch** via GitHub Actions UI (for testing)

### 4.2 Parallel Execution

Jobs run in parallel for faster feedback:
- Code Quality (Lint & Type Check)
- Unit Tests
- SonarQube SAST
- npm audit
- Snyk Security

All jobs must complete successfully for the CI Summary job to pass.

### 4.3 Concurrency Control

The workflow uses concurrency groups to:
- Cancel in-progress runs when new commits are pushed to the same PR
- Optimize GitHub Actions minutes usage
- Provide faster feedback on latest changes

---

## Part 5: Monitoring and Maintenance

### 5.1 View CI Results

**In Pull Requests:**
- Navigate to any PR
- View **Checks** tab to see all CI job results
- Click on individual jobs for detailed logs
- View summary at the bottom of the PR

**In Actions Tab:**
- Navigate to **Actions** tab in repository
- View all workflow runs
- Filter by status, branch, or workflow name

### 5.2 Artifacts

The CI pipeline uploads artifacts for debugging:
- `lint-results` - ESLint and TypeScript output
- `test-coverage` - Code coverage reports
- `sonarqube-results` - Detailed SAST findings
- `npm-audit-results` - Vulnerability audit JSON
- `snyk-results` - Snyk security scan results

Artifacts are retained for 7 days.

### 5.3 Regular Maintenance

**Weekly:**
- Review Snyk and SonarQube dashboards for trends
- Update dependencies with security patches

**Monthly:**
- Review and update security tool versions
- Rotate access tokens if required by security policy
- Review SonarQube quality gate settings

**Quarterly:**
- Audit branch protection rules
- Review CI performance metrics
- Update Node.js version in workflow if needed

---

## Part 6: Troubleshooting

### Common Issues and Solutions

#### Issue: "Secret not found" errors

**Solution:**
1. Verify secrets are added to repository (not organization)
2. Check secret names match exactly (case-sensitive)
3. Ensure secrets have no trailing spaces
4. For organization secrets, verify repository access

#### Issue: SonarQube Quality Gate fails

**Solution:**
1. Review SonarQube dashboard for specific issues
2. Common failures:
   - Code coverage below threshold
   - High code smells or technical debt
   - Security hotspots or vulnerabilities
3. Fix issues in code and push new commit
4. Adjust quality gate settings in SonarQube if needed

#### Issue: npm audit fails with vulnerabilities

**Solution:**
1. Run `npm audit` locally to see vulnerabilities
2. Run `npm audit fix` to automatically fix (if possible)
3. For unfixable vulnerabilities:
   - Check if a newer version is available
   - Consider alternative packages
   - Document and accept risk if no alternative (not recommended)

#### Issue: Snyk test fails

**Solution:**
1. Review Snyk dashboard for specific vulnerabilities
2. Update vulnerable dependencies:
   ```bash
   npm update [package-name]
   ```
3. If no fix available, use Snyk to:
   - Ignore specific vulnerabilities (with justification)
   - Set remediation timeline

#### Issue: Type check fails

**Solution:**
1. Run `npm run type-check` locally
2. Fix TypeScript errors
3. Ensure `tsconfig.json` is properly configured
4. Check for missing type definitions: `npm install --save-dev @types/[package]`

#### Issue: Tests fail only in CI

**Solution:**
1. Check for environment-specific issues:
   - Timezone differences
   - File path case sensitivity
   - Missing environment variables
2. Run tests with CI flag locally:
   ```bash
   npm run test:unit -- --ci
   ```
3. Review test logs in Actions tab

---

## Part 7: Continuous Improvement

### Metrics to Track

- **CI Pipeline Duration** - Target: < 10 minutes
- **Pass Rate** - Target: > 95%
- **Code Coverage** - Target: > 80%
- **Security Vulnerabilities** - Target: 0 high/critical

### Optimization Opportunities

1. **Caching:** Already implemented for npm dependencies
2. **Matrix Strategy:** Run tests across multiple Node versions (if needed)
3. **Conditional Jobs:** Skip certain checks for documentation-only changes
4. **Test Splitting:** Parallel test execution for larger test suites

---

## Part 8: Security Best Practices

### Token Security

- ✅ Use GitHub secrets for all tokens
- ✅ Never commit tokens to repository
- ✅ Rotate tokens every 90 days
- ✅ Use minimum required permissions
- ✅ Audit secret access regularly

### Workflow Security

- ✅ Pin action versions to specific commits (v4 vs master)
- ✅ Review third-party actions before use
- ✅ Use `continue-on-error: false` for critical checks
- ✅ Limit workflow permissions (GITHUB_TOKEN)
- ✅ Enable security hardening in SonarQube and Snyk

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SonarQube Documentation](https://docs.sonarqube.org/)
- [Snyk Documentation](https://docs.snyk.io/)
- [npm audit Documentation](https://docs.npmjs.com/cli/v9/commands/npm-audit)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

## Support and Contact

For issues with the CI pipeline:
1. Check this documentation first
2. Review recent workflow runs in Actions tab
3. Check SonarQube and Snyk dashboards
4. Contact the DevOps team or create an issue in the repository

---

**Last Updated:** 2025-09-30
**Maintained by:** DevOps Team

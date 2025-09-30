# GitHub CI/CD Configuration

This directory contains GitHub Actions workflows and setup documentation for the BerthCare project.

## Quick Start

Follow these steps in order to set up the CI pipeline:

### 1. Configure Secrets (5 minutes)
Follow: [SECRETS-REFERENCE.md](SECRETS-REFERENCE.md)

**Required secrets:**
- `SONAR_TOKEN` - SonarQube authentication
- `SONAR_HOST_URL` - SonarQube instance URL
- `SNYK_TOKEN` - Snyk API token

### 2. Setup Project Configuration (15 minutes)
Follow: [PACKAGE-SCRIPTS-TEMPLATE.md](PACKAGE-SCRIPTS-TEMPLATE.md)

**Add to your project:**
- npm scripts in `package.json`
- ESLint configuration (`.eslintrc.json`)
- TypeScript configuration (`tsconfig.json`)
- Jest configuration (`jest.config.js`)
- SonarQube configuration (`sonar-project.properties`)

### 3. Configure Branch Protection (10 minutes)
Follow: [BRANCH-PROTECTION-SETUP.md](BRANCH-PROTECTION-SETUP.md)

**Steps:**
1. Create test PR to register status checks
2. Enable branch protection for `main`
3. Configure required status checks
4. Set approval requirements

### 4. Detailed CI Setup (Reference)
See: [CI-SETUP.md](CI-SETUP.md)

**Comprehensive guide covering:**
- Workflow architecture
- Monitoring and maintenance
- Troubleshooting
- Security best practices

---

## What's Included

### Workflows

#### `workflows/ci.yml`
Production-ready CI pipeline that runs on PRs to `main`:

**Jobs:**
1. **Code Quality** - ESLint + TypeScript checks
2. **Unit Tests** - Jest with coverage reporting
3. **SAST** - SonarQube security analysis
4. **npm audit** - Dependency vulnerability scanning
5. **Snyk** - Comprehensive security testing
6. **CI Summary** - Aggregated results

**Features:**
- Parallel execution for fast feedback
- Artifact uploads for debugging
- Detailed status reporting
- Automatic quality gates

---

## CI Pipeline Overview

```
Pull Request Created
        │
        ├─────────────────────────────────────────┐
        │                                         │
        ▼                                         ▼
┌───────────────────┐                   ┌──────────────────┐
│   Code Quality    │                   │   Unit Tests     │
│  (Lint + Types)   │                   │  (Coverage)      │
└───────────────────┘                   └──────────────────┘
        │                                         │
        ├─────────────────────────────────────────┤
        │                                         │
        ▼                                         ▼
┌───────────────────┐                   ┌──────────────────┐
│   SonarQube       │                   │   npm audit      │
│   (SAST)          │                   │   (Security)     │
└───────────────────┘                   └──────────────────┘
        │                                         │
        └─────────────────┬───────────────────────┘
                          ▼
                  ┌──────────────────┐
                  │   Snyk Security  │
                  │   (Deep Scan)    │
                  └──────────────────┘
                          │
                          ▼
                  ┌──────────────────┐
                  │   CI Summary     │
                  │  (All Results)   │
                  └──────────────────┘
                          │
                          ▼
                  All Checks Pass?
                          │
                    YES   │   NO
                          │
                    ┌─────┴─────┐
                    ▼           ▼
              Ready to     Fix Issues
               Merge       & Re-run
```

---

## Requirements

### Before First CI Run

**GitHub Secrets:**
- ✅ SONAR_TOKEN configured
- ✅ SONAR_HOST_URL configured
- ✅ SNYK_TOKEN configured

**Project Configuration:**
- ✅ package.json with required scripts
- ✅ .eslintrc.json
- ✅ tsconfig.json
- ✅ jest.config.js
- ✅ sonar-project.properties

### For Successful CI Pass

**Code must:**
- ✅ Pass ESLint with 0 warnings
- ✅ Pass TypeScript type checks
- ✅ Pass all unit tests
- ✅ Meet coverage thresholds (80%)
- ✅ Pass SonarQube quality gate
- ✅ Have 0 high/critical vulnerabilities (npm audit)
- ✅ Have 0 high/critical vulnerabilities (Snyk)

---

## Local Development

Before pushing code, run these checks locally:

```bash
# Install dependencies
npm ci

# Run all checks
npm run lint              # Check code style
npm run type-check        # Check types
npm run test:unit         # Run tests
npm run test:unit:coverage # Check coverage

# Or run everything
npm run test:all
```

---

## Monitoring CI

### View CI Status

**In Pull Requests:**
- Navigate to the **Checks** tab
- View individual job logs
- See aggregated summary at bottom

**In Actions Tab:**
- See all workflow runs
- Filter by status, branch, or workflow
- Download artifacts for debugging

### CI Artifacts

Available for 7 days after each run:
- `lint-results` - ESLint/TypeScript output
- `test-coverage` - Coverage reports
- `sonarqube-results` - SAST findings
- `npm-audit-results` - Vulnerability details
- `snyk-results` - Security scan results

---

## Troubleshooting

### Quick Diagnostic

| Symptom | Check | Solution |
|---------|-------|----------|
| CI not running | Secrets configured? | Add missing secrets |
| Lint failures | Run `npm run lint` locally | Fix linting errors |
| Test failures | Run `npm test` locally | Fix failing tests |
| Coverage too low | Check coverage report | Add more tests |
| SonarQube fails | Check SonarQube dashboard | Fix code smells/bugs |
| Snyk fails | Check Snyk dashboard | Update dependencies |

### Detailed Troubleshooting

See [CI-SETUP.md - Part 6: Troubleshooting](CI-SETUP.md#part-6-troubleshooting)

---

## Security

### Best Practices

- ✅ All secrets stored in GitHub Secrets
- ✅ Never commit tokens or credentials
- ✅ Rotate tokens every 90 days
- ✅ Branch protection enforces all checks
- ✅ Minimum 1 approval required
- ✅ CODEOWNERS review required

### Security Scanning

**Automated:**
- SAST via SonarQube (code security issues)
- Dependency scanning via npm audit
- Comprehensive security via Snyk

**Manual:**
- Code review by at least 1 reviewer
- Code Owner approval for critical paths

---

## Performance

### Current Metrics

**Average CI Duration:** ~8-10 minutes
- Code Quality: ~2 minutes
- Unit Tests: ~3 minutes
- SonarQube: ~2 minutes
- npm audit: ~1 minute
- Snyk: ~2 minutes

**Optimization:**
- Jobs run in parallel
- npm caching enabled
- Concurrency groups prevent redundant runs

---

## Maintenance

### Weekly
- Review failed CI runs
- Update dependencies with security patches
- Check SonarQube/Snyk dashboards

### Monthly
- Rotate access tokens (if policy requires)
- Review CI performance metrics
- Update workflow dependencies

### Quarterly
- Audit branch protection rules
- Review and update quality gate thresholds
- Update Node.js version if needed

---

## Support

### Getting Help

1. Check documentation in this directory
2. Review recent workflow runs
3. Check SonarQube/Snyk dashboards
4. Contact DevOps team

### Reporting Issues

When reporting CI issues, include:
- Link to failed workflow run
- Error messages from logs
- Steps to reproduce locally
- Attempted solutions

---

## Document Index

| Document | Purpose | Read When |
|----------|---------|-----------|
| [README.md](README.md) | Overview and quick start | First time setup |
| [SECRETS-REFERENCE.md](SECRETS-REFERENCE.md) | Secret configuration | Setting up CI |
| [PACKAGE-SCRIPTS-TEMPLATE.md](PACKAGE-SCRIPTS-TEMPLATE.md) | Project configuration | Adding scripts |
| [BRANCH-PROTECTION-SETUP.md](BRANCH-PROTECTION-SETUP.md) | Branch protection rules | Securing branches |
| [CI-SETUP.md](CI-SETUP.md) | Comprehensive CI guide | Detailed reference |

---

## Next Steps

After CI is working:

1. ✅ Configure branch protection (see [BRANCH-PROTECTION-SETUP.md](BRANCH-PROTECTION-SETUP.md))
2. ✅ Add deployment workflows (Phase 5)
3. ✅ Set up staging environment
4. ✅ Configure automated releases
5. ✅ Add performance testing
6. ✅ Implement end-to-end tests

---

**CI Pipeline Status:** ✅ Configured and Ready

**Last Updated:** 2025-09-30
**Maintained by:** DevOps Team

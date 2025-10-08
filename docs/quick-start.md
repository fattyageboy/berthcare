# Quick Start Guide

## Prerequisites

- Node.js 20+ and npm 10+
- Docker Desktop (for local development)
- Git
- GitHub account with repository access

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd berthcare
```

### 2. Install Dependencies

```bash
npm ci
```

This will install all dependencies defined in `package.json`, including:
- TypeScript
- ESLint & Prettier
- Jest & ts-jest
- Type definitions (@types/jest, @types/node)

### 3. Start Local Development Environment

Get PostgreSQL, Redis, and LocalStack S3 running:

```bash
# Copy environment configuration
cp .env.example .env

# Start all services
docker-compose up --build

# Verify services are healthy (in another terminal)
docker-compose ps
```

For detailed setup instructions and troubleshooting, see [Local Setup Guide](./local-setup.md).

### 4. Verify Setup

Run all CI checks locally to ensure everything works:

```bash
# Run linting
npm run lint

# Check formatting
npm run format:check

# Run type checking
npm run type-check

# Run tests
npm test
```

All commands should complete successfully.

## Development Workflow

### Before Committing

Always run these checks before committing:

```bash
# Auto-fix formatting issues
npm run format

# Auto-fix linting issues (where possible)
npm run lint -- --fix

# Run type check
npm run type-check

# Run tests
npm test
```

### Creating a Pull Request

1. **Create a feature branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes and commit**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. **Push to GitHub**:
   ```bash
   git push origin feat/your-feature-name
   ```

4. **Create PR on GitHub**:
   - Go to repository on GitHub
   - Click "Pull requests" > "New pull request"
   - Select your branch
   - Fill in PR description
   - Click "Create pull request"

5. **Wait for CI checks**:
   - GitHub Actions will automatically run all CI checks
   - All checks must pass before merging
   - Fix any failures and push updates

6. **Request review**:
   - Request review from team members
   - Address any feedback
   - Once approved and CI passes, merge the PR

## Common Commands

### Linting

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint -- --fix

# Lint specific file
npx eslint path/to/file.ts
```

### Formatting

```bash
# Check formatting
npm run format:check

# Auto-fix formatting
npm run format

# Format specific file
npx prettier --write path/to/file.ts
```

### Type Checking

```bash
# Check all files
npm run type-check

# Check specific file
npx tsc --noEmit path/to/file.ts
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="your test name"
```

## Troubleshooting

### "Cannot find name 'describe'" or similar Jest errors

This is expected before running `npm ci`. The error will resolve after installing dependencies.

### ESLint errors

```bash
# See what's wrong
npm run lint

# Try auto-fix
npm run lint -- --fix

# If auto-fix doesn't work, manually fix the issues
```

### Prettier formatting conflicts

```bash
# Auto-fix all formatting
npm run format

# Check what would change
npm run format:check
```

### TypeScript errors

```bash
# Run type check to see errors
npm run type-check

# Check specific file
npx tsc --noEmit path/to/file.ts
```

### Tests failing

```bash
# Run tests to see failures
npm test

# Run specific test
npm test -- path/to/test.test.ts

# Run with verbose output
npm test -- --verbose
```

### CI passing locally but failing on GitHub

1. Ensure you've committed all changes
2. Ensure you've pushed all changes
3. Check GitHub Actions logs for specific error
4. Try running `npm ci` (clean install) locally
5. Ensure Node version matches (20+)

## CI Pipeline Details

The CI pipeline runs automatically on every PR to `main` and includes:

1. **Lint & Format Check** - ESLint + Prettier
2. **TypeScript Type Check** - tsc --noEmit
3. **Unit Tests** - Jest with coverage
4. **Security Scan** - Snyk SAST
5. **Dependency Audit** - npm audit
6. **All Checks Complete** - Final gate

All checks must pass before merging.

## Getting Help

- **CI Setup**: See `docs/ci-setup.md`
- **Branch Protection**: See `docs/github-branch-protection-setup.md`
- **Task Details**: See `docs/E2-completion-summary.md`
- **Architecture**: See `project-documentation/architecture-output.md`

## Next Steps

After completing E2:
- E3: Configure monorepo structure
- E4: Set up local development environment
- E5: Configure AWS infrastructure
- E6: Set up monitoring & observability

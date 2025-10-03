# Test Installation Guide

## Quick Start

```bash
# Navigate to backend directory
cd backend

# Install dependencies (including test dependencies)
npm install

# Run integration tests
npm run test:integration
```

## Step-by-Step Installation

### 1. Install Dependencies

The following test dependencies will be installed:
- jest - Testing framework
- ts-jest - TypeScript support for Jest
- supertest - HTTP assertion library
- @types/jest - TypeScript definitions for Jest
- @types/supertest - TypeScript definitions for Supertest

```bash
npm install
```

### 2. Verify Database Setup

Ensure PostgreSQL is running and migrations are applied:

```bash
# Check PostgreSQL is running
pg_isready

# Apply migrations if not already done
npm run migrate
```

### 3. Configure Test Environment

The `.env.test` file is already configured with default values. Update if needed:

```bash
# Edit test environment variables
nano .env.test
```

### 4. Run Tests

```bash
# Run all integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch
```

## Expected Output

```
PASS  tests/integration/visit.lifecycle.test.ts
  Visit Service - Full Lifecycle Integration Tests
    ✓ GET /api/visits - Retrieve Visits (4 tests)
    ✓ POST /api/visits/:id/check-in (4 tests)
    ✓ POST /api/visits/:id/verify-location (1 test)
    ✓ PUT /api/visits/:id/documentation (4 tests)
    ✓ POST /api/visits/:id/complete (3 tests)
    ✓ Full Visit Lifecycle - End-to-End (1 test)

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        X.XXXs
```

## Troubleshooting

### Issue: Cannot connect to database

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Verify connection settings in .env.test
cat .env.test
```

### Issue: Tests fail with "relation does not exist"

**Solution:**
```bash
# Run migrations
npm run migrate
```

### Issue: Tests timeout

**Solution:**
- Increase timeout in `jest.config.js`
- Check database performance
- Ensure no other processes are blocking the database

### Issue: Module not found errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## CI/CD Setup

For continuous integration:

```yaml
# Example GitHub Actions workflow
- name: Install dependencies
  run: cd backend && npm install

- name: Run migrations
  run: cd backend && npm run migrate
  env:
    NODE_ENV: test
    DB_HOST: localhost
    DB_NAME: berthcare_test

- name: Run integration tests
  run: cd backend && npm run test:integration
  env:
    NODE_ENV: test
```

## Next Steps

After successful test execution:
1. Review test coverage report in `coverage/` directory
2. Add unit tests for business logic
3. Configure CI/CD pipeline
4. Set up test database for CI environment

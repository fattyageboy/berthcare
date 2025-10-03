# BerthCare Backend Tests

## Overview

This directory contains the test suite for the BerthCare backend services, including unit tests and integration tests.

## Test Structure

```
tests/
├── integration/          # Integration tests (API + Database)
│   ├── visit-endpoints.test.ts    # Individual endpoint tests
│   └── visit-lifecycle.test.ts    # Full lifecycle workflow tests
├── unit/                 # Unit tests (isolated logic)
│   └── location-service.test.ts   # Location service unit tests
├── setup.ts             # Global test configuration
└── README.md            # This file
```

## Prerequisites

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `jest` - Test framework
- `ts-jest` - TypeScript support for Jest
- `supertest` - HTTP assertion library
- `@types/jest` - TypeScript definitions
- `@types/supertest` - TypeScript definitions

### 2. Setup Test Database

The integration tests require a PostgreSQL database. You can use the development database or create a separate test database.

#### Option A: Use Docker Compose (Recommended)

```bash
# From project root
docker-compose -f docker-compose.dev.yml up -d postgres
```

#### Option B: Local PostgreSQL

Ensure PostgreSQL is running locally on port 5432.

### 3. Run Migrations

```bash
# Set test database URL
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/berthcare_test

# Run migrations
npm run migrate
```

Or create a `.env.test` file:

```env
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/berthcare_test
REDIS_URL=redis://localhost:6379/1
```

## Running Tests

### All Tests

```bash
npm test
```

### Integration Tests Only

```bash
npm run test:integration
```

### Unit Tests Only

```bash
npm run test:unit
```

### Specific Test File

```bash
# Visit lifecycle tests
npm run test:lifecycle

# Or use Jest directly
npx jest tests/integration/visit-lifecycle.test.ts
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

This generates:
- Console output with coverage summary
- HTML report in `coverage/` directory
- LCOV report for CI/CD integration

## Test Configuration

### Jest Configuration (`jest.config.js`)

- **Preset:** `ts-jest` for TypeScript support
- **Test Environment:** Node.js
- **Test Match:** `**/*.test.ts` files in `tests/` directory
- **Timeout:** 30 seconds (for database operations)
- **Coverage:** Collects from `src/**/*.ts` files

### Global Setup (`tests/setup.ts`)

- Sets Jest timeout to 30 seconds
- Suppresses console logs during tests (unless errors occur)
- Runs before all tests

## Writing Tests

### Integration Test Template

```typescript
import request from 'supertest';
import { database } from '../../src/config/database';
import server from '../../src/services/visit';

describe('My Feature', () => {
  let testDataId: string;

  beforeAll(async () => {
    await database.connect();
  });

  afterAll(async () => {
    await database.disconnect();
    server.close();
  });

  beforeEach(async () => {
    // Create test data
    const result = await database.query(
      'INSERT INTO table_name (...) VALUES (...) RETURNING id',
      [...]
    );
    testDataId = result.rows[0].id;
  });

  afterEach(async () => {
    // Clean up test data
    await database.query('DELETE FROM table_name WHERE id = $1', [testDataId]);
  });

  it('should do something', async () => {
    const response = await request(server)
      .get('/api/endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('field');
  });
});
```

### Unit Test Template

```typescript
import { myFunction } from '../../src/utils/myModule';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });

  it('should handle edge case', () => {
    expect(() => myFunction(invalidInput)).toThrow();
  });
});
```

## Test Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` and `afterEach` for setup/cleanup
- Don't rely on test execution order

### 2. Test Data
- Create minimal test data needed for each test
- Clean up test data after each test
- Use descriptive test data (e.g., 'test@example.com')

### 3. Assertions
- Test one thing per test case
- Use descriptive test names
- Include both positive and negative test cases

### 4. Database Tests
- Verify both API response and database state
- Test foreign key relationships
- Test data type conversions (JSON, arrays, PostGIS)

### 5. Error Handling
- Test validation errors (400)
- Test not found errors (404)
- Test state transition errors
- Test edge cases

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run migrations
        run: |
          cd backend
          npm run migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/berthcare_test
      
      - name: Run tests
        run: |
          cd backend
          npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/berthcare_test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
```

## Troubleshooting

### Tests Timeout

If tests timeout, check:
- Database is running and accessible
- Migrations have been run
- Connection string is correct
- No hanging database connections

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
psql postgresql://postgres:postgres@localhost:5432/berthcare_test

# Reset database
npm run db:reset
```

### Port Already in Use

If the test server port is in use:
```bash
# Find process using port
lsof -i :3002

# Kill process
kill -9 <PID>
```

### Clean Test Database

```bash
# Drop and recreate test database
psql -U postgres -c "DROP DATABASE IF EXISTS berthcare_test;"
psql -U postgres -c "CREATE DATABASE berthcare_test;"

# Run migrations
npm run migrate
```

## Test Coverage Goals

- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

Current coverage can be viewed by running:
```bash
npm run test:coverage
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [BerthCare Testing Setup Guide](../TESTING_SETUP.md)

## Support

For questions or issues with tests:
1. Check this README
2. Review existing test files for examples
3. Check the main TESTING_SETUP.md guide
4. Contact the development team

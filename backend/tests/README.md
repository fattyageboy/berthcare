# BerthCare Backend Tests

This directory contains unit and integration tests for the BerthCare backend services.

## Test Structure

```
tests/
├── integration/          # Integration tests (API endpoints, database)
│   └── visit.lifecycle.test.ts
├── unit/                 # Unit tests (business logic, utilities)
├── helpers/              # Test utilities and helpers
│   └── db.helper.ts
├── setup.ts              # Global test setup
└── README.md
```

## Running Tests

### Prerequisites

1. Ensure PostgreSQL is running and accessible
2. Database migrations have been applied
3. Test environment variables are configured (`.env.test`)

### Commands

```bash
# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Run unit tests only
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Integration Tests

Integration tests verify the complete visit service workflow:

1. **Visit Retrieval** - GET /api/visits
   - Retrieve visits for authenticated user
   - Filter by status, date range, client
   - Pagination support

2. **Check-In** - POST /api/visits/:id/check-in
   - Check in to scheduled visit
   - Location verification
   - Status transition: scheduled → in_progress

3. **Documentation** - PUT /api/visits/:id/documentation
   - Update visit documentation
   - Partial updates (merge with existing data)
   - Add photos and notes

4. **Completion** - POST /api/visits/:id/complete
   - Complete visit with final documentation
   - Capture signature and checkout location
   - Status transition: in_progress → completed

5. **Full Lifecycle** - End-to-end workflow
   - Complete visit flow from creation to completion
   - Verify database state at each step
   - Validate data integrity

## Test Database

Tests use the same database as development but clean up test data after each run:
- Test data is prefixed with `test-` or `TEST-`
- Cleanup runs after all tests complete
- Each test gets a fresh visit instance

## Writing Tests

### Integration Test Template

```typescript
describe('Feature Name', () => {
  let testData: any;

  beforeAll(async () => {
    // Setup test data
    testData = await seedTestData();
  });

  afterAll(async () => {
    // Cleanup
    await cleanupTestData();
  });

  it('should perform expected behavior', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .set('x-user-id', userId)
      .send(data);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Test Coverage

Run `npm run test:coverage` to generate coverage reports:
- Console summary
- HTML report in `coverage/` directory
- LCOV report for CI/CD integration

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check connection settings in `.env.test`
- Ensure database exists: `psql -l`

### Test Failures
- Check test database has latest migrations
- Verify test data cleanup is working
- Review test logs for specific errors

### Timeout Issues
- Increase timeout in `jest.config.js` (default: 30s)
- Check for slow database queries
- Ensure test database is not overloaded

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:
- Use `--runInBand` flag for integration tests (sequential execution)
- Set `NODE_ENV=test` environment variable
- Configure test database connection
- Run migrations before tests

Example CI command:
```bash
NODE_ENV=test npm run migrate && npm run test:integration
```

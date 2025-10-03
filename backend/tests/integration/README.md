# Integration Tests

## Overview

Integration tests verify that different components of the application work together correctly. These tests use real database connections, HTTP servers, and WebSocket connections to ensure end-to-end functionality.

## Test Suites

### Visit Service Tests
**File**: `visit.lifecycle.test.ts`

Tests the complete visit lifecycle:
- Create visit
- Check-in with location verification
- Document visit activities
- Complete visit
- Retrieve visit history

### Sync Service Tests
**File**: `sync.service.test.ts`

Tests offline synchronization functionality:
- Pull changes from server
- Push changes to server
- Conflict detection and resolution
- WebSocket real-time updates
- End-to-end sync cycles

## Prerequisites

### 1. Test Database
Create a test database:
```bash
createdb berthcare_test
```

### 2. Run Migrations
Apply database schema:
```bash
cd backend
npm run migrate
```

### 3. Environment Variables
Ensure test environment is configured in `tests/setup.ts`:
```typescript
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'berthcare_test';
```

## Running Tests

### Run All Integration Tests
```bash
npm test tests/integration
```

### Run Specific Test Suite
```bash
# Visit service tests
npm test tests/integration/visit.lifecycle.test.ts

# Sync service tests
npm test tests/integration/sync.service.test.ts
```

### Run Specific Test
```bash
npm test -- --testNamePattern="should pull changes since last sync"
```

### Run with Coverage
```bash
npm run test:coverage -- tests/integration
```

### Run in Watch Mode
```bash
npm test -- --watch tests/integration
```

### Run with Verbose Output
```bash
npm test -- --verbose tests/integration
```

## Test Structure

### Setup & Teardown
```typescript
beforeAll(async () => {
  // Initialize database connection
  // Seed test data
  // Start servers
});

afterAll(async () => {
  // Cleanup test data
  // Close connections
  // Stop servers
});

beforeEach(async () => {
  // Create fresh test data
});

afterEach(async () => {
  // Cleanup test-specific resources
});
```

### Test Pattern
```typescript
describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    it('should do something specific', async () => {
      // Arrange: Setup test data
      const testData = { ... };
      
      // Act: Perform action
      const response = await request(app)
        .post('/api/endpoint')
        .send(testData);
      
      // Assert: Verify results
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
```

## Test Data Management

### Seeding Test Data
Use helper functions from `tests/helpers/db.helper.ts`:

```typescript
// Seed organization
const orgId = await seedTestOrganization();

// Seed user
const userId = await seedTestUser(orgId);

// Seed client
const clientId = await seedTestClient(orgId);

// Seed visit
const visitId = await seedTestVisit(clientId, userId);
```

### Cleanup
```typescript
// Clean all test data
await cleanupTestData();

// Close database connection
await closeTestPool();
```

## WebSocket Testing

### Connection Pattern
```typescript
import { io as ioClient } from 'socket.io-client';

it('should receive WebSocket events', (done) => {
  const socket = ioClient('http://localhost:3003');
  
  socket.on('connect', () => {
    socket.emit('authenticate', { user_id: userId });
  });
  
  socket.on('connection:established', () => {
    // Test authenticated connection
    done();
  });
  
  socket.on('error', (error) => {
    done(error);
  });
});
```

### Event Testing
```typescript
socket.on('entity:changed', (event) => {
  expect(event.data.entity_type).toBe('visits');
  expect(event.data.operation).toBe('update');
  done();
});

// Trigger event via HTTP
await request(app).post('/api/sync/push')...
```

## Troubleshooting

### Database Connection Errors

**Problem**: Cannot connect to test database

**Solutions**:
1. Verify database exists: `psql -l | grep berthcare_test`
2. Create database: `createdb berthcare_test`
3. Check credentials in `tests/setup.ts`
4. Ensure PostgreSQL is running

### Migration Errors

**Problem**: Tables don't exist

**Solutions**:
1. Run migrations: `npm run migrate`
2. Check migration files in `migrations/`
3. Verify database connection
4. Check migration status: `npm run migrate -- list`

### WebSocket Timeout Errors

**Problem**: WebSocket tests timeout

**Solutions**:
1. Increase timeout: `jest.setTimeout(30000)`
2. Check server is running on correct port
3. Verify WebSocket server initialized
4. Check firewall/network settings

### Port Conflicts

**Problem**: Address already in use

**Solutions**:
1. Stop other services on same port
2. Change port in configuration
3. Kill process: `lsof -ti:3003 | xargs kill`

### Test Data Pollution

**Problem**: Tests fail due to existing data

**Solutions**:
1. Ensure cleanup runs: Check `afterAll` hooks
2. Manually clean: `await cleanupTestData()`
3. Reset database: `npm run db:reset`
4. Use unique test data identifiers

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use fresh data for each test
- Clean up after tests
- Don't rely on test execution order

### 2. Realistic Scenarios
- Test real-world use cases
- Use realistic test data
- Test error conditions
- Test edge cases

### 3. Clear Assertions
- One concept per test
- Specific expectations
- Meaningful error messages
- Verify all side effects

### 4. Performance
- Keep tests fast (< 30s total)
- Use minimal test data
- Avoid unnecessary delays
- Clean up efficiently

### 5. Maintainability
- Clear test descriptions
- Consistent patterns
- Reusable helpers
- Good documentation

## Coverage Goals

### Target Coverage
- **Overall**: >85%
- **Controllers**: >90%
- **Services**: >85%
- **Repositories**: >80%

### Generate Coverage Report
```bash
npm run test:coverage -- tests/integration

# View HTML report
open coverage/lcov-report/index.html
```

## Continuous Integration

### CI Configuration
Tests run automatically on:
- Pull requests
- Commits to main branch
- Scheduled nightly builds

### CI Requirements
- Test database available
- Environment variables set
- Migrations applied
- All dependencies installed

### CI Commands
```yaml
# .github/workflows/ci.yml
- name: Run integration tests
  run: |
    npm run migrate
    npm test tests/integration
  env:
    NODE_ENV: test
    DB_NAME: berthcare_test
```

## Debugging Tests

### Debug Single Test
```bash
# Add debugger statement in test
it('should do something', async () => {
  debugger;
  const response = await request(app)...
});

# Run with Node inspector
node --inspect-brk node_modules/.bin/jest tests/integration/sync.service.test.ts
```

### View Test Output
```bash
# Verbose output
npm test -- --verbose

# Show console logs
npm test -- --silent=false

# Show all output
npm test -- --verbose --silent=false
```

### Isolate Failing Test
```bash
# Run only one test
npm test -- --testNamePattern="exact test name"

# Skip other tests
it.only('should run this test', () => {
  // Only this test runs
});
```

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Socket.io Client Documentation](https://socket.io/docs/v4/client-api/)

### Helper Files
- `tests/setup.ts` - Global test configuration
- `tests/helpers/db.helper.ts` - Database utilities
- `tests/integration/README.md` - This file

### Related Files
- `jest.config.js` - Jest configuration
- `tsconfig.json` - TypeScript configuration
- `.env.test` - Test environment variables

## Support

For issues or questions:
1. Check this README
2. Review test examples
3. Check Jest documentation
4. Ask team for help

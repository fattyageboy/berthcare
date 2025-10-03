# Integration Tests - Verification Checklist

Use this checklist to verify the integration tests are working correctly.

## Pre-Test Verification

### Environment Setup
- [ ] PostgreSQL is running
  ```bash
  pg_isready
  # Expected: accepting connections
  ```

- [ ] Database exists
  ```bash
  psql -l | grep berthcare
  # Expected: berthcare database listed
  ```

- [ ] Migrations applied
  ```bash
  psql -d berthcare -c "\dt" | grep visits
  # Expected: visits table exists
  ```

- [ ] Dependencies installed
  ```bash
  ls node_modules/jest node_modules/supertest
  # Expected: directories exist
  ```

### Configuration Files
- [ ] `jest.config.js` exists
- [ ] `tests/setup.ts` exists
- [ ] `.env.test` exists
- [ ] `tests/helpers/db.helper.ts` exists
- [ ] `tests/integration/visit.lifecycle.test.ts` exists

## Test Execution

### Run Tests
```bash
cd backend
npm run test:integration
```

### Expected Output Checklist

#### Test Suite Header
- [ ] Shows "Visit Service - Full Lifecycle Integration Tests"
- [ ] Shows test file path

#### GET /api/visits Tests (4 tests)
- [ ] ✓ should retrieve visits for authenticated user
- [ ] ✓ should filter visits by status
- [ ] ✓ should return 401 if user is not authenticated
- [ ] ✓ should validate required query parameters

#### POST /api/visits/:id/check-in Tests (4 tests)
- [ ] ✓ should successfully check in to a scheduled visit
- [ ] ✓ should reject check-in with invalid location data
- [ ] ✓ should reject check-in for non-scheduled visit
- [ ] ✓ should return 404 for non-existent visit

#### POST /api/visits/:id/verify-location Tests (1 test)
- [ ] ✓ should verify location against client address

#### PUT /api/visits/:id/documentation Tests (4 tests)
- [ ] ✓ should update visit documentation
- [ ] ✓ should support partial documentation updates
- [ ] ✓ should add photos to visit
- [ ] ✓ should reject documentation update for completed visit

#### POST /api/visits/:id/complete Tests (3 tests)
- [ ] ✓ should successfully complete a visit
- [ ] ✓ should complete visit without optional fields
- [ ] ✓ should reject completion for non-in-progress visit

#### Full Lifecycle Test (1 test)
- [ ] ✓ should complete full visit workflow

#### Summary
- [ ] Test Suites: 1 passed, 1 total
- [ ] Tests: 17 passed, 17 total
- [ ] No failures
- [ ] No errors
- [ ] Execution time < 30 seconds

## Post-Test Verification

### Database Cleanup
```bash
# Check no test data remains
psql -d berthcare -c "SELECT COUNT(*) FROM visits WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'test-%');"
# Expected: count = 0

psql -d berthcare -c "SELECT COUNT(*) FROM users WHERE email LIKE 'test-%';"
# Expected: count = 0

psql -d berthcare -c "SELECT COUNT(*) FROM clients WHERE client_number LIKE 'TEST-%';"
# Expected: count = 0
```

### Test Artifacts
- [ ] No error logs in console
- [ ] No hanging database connections
- [ ] Test process exits cleanly

## Coverage Report Verification

### Generate Coverage
```bash
npm run test:coverage
```

### Coverage Checklist
- [ ] Coverage report generated
- [ ] HTML report in `coverage/` directory
- [ ] LCOV report in `coverage/lcov.info`
- [ ] Console shows coverage summary

### Expected Coverage Areas
- [ ] Visit controller covered
- [ ] Visit repository covered
- [ ] Visit routes covered
- [ ] Validators covered

## Troubleshooting Checklist

### If Tests Fail

#### Database Connection Issues
- [ ] Check PostgreSQL is running: `pg_isready`
- [ ] Verify connection settings in `.env.test`
- [ ] Test connection: `psql -d berthcare -c "SELECT 1"`

#### Migration Issues
- [ ] Run migrations: `npm run migrate`
- [ ] Verify tables exist: `psql -d berthcare -c "\dt"`
- [ ] Check migration status: `psql -d berthcare -c "SELECT * FROM pgmigrations"`

#### Dependency Issues
- [ ] Remove node_modules: `rm -rf node_modules`
- [ ] Remove package-lock: `rm package-lock.json`
- [ ] Reinstall: `npm install`
- [ ] Verify jest installed: `npm list jest`

#### Test Data Issues
- [ ] Manually cleanup: `npm run db:reset`
- [ ] Verify cleanup worked: Check database queries above
- [ ] Re-run tests

#### Timeout Issues
- [ ] Check database performance
- [ ] Increase timeout in `jest.config.js`
- [ ] Check for blocking queries

## CI/CD Integration Checklist

### GitHub Actions / GitLab CI
- [ ] PostgreSQL service configured
- [ ] Environment variables set
- [ ] Migrations run before tests
- [ ] Test command: `npm run test:integration`
- [ ] Coverage upload configured (optional)

### Example CI Configuration
```yaml
- name: Setup Database
  run: |
    psql -c 'CREATE DATABASE berthcare;'
    cd backend && npm run migrate

- name: Run Integration Tests
  run: cd backend && npm run test:integration
  env:
    NODE_ENV: test
    DB_HOST: localhost
    DB_NAME: berthcare
    DB_USER: postgres
    DB_PASSWORD: postgres
```

## Performance Checklist

### Test Execution Time
- [ ] Total time < 30 seconds
- [ ] Individual tests < 5 seconds
- [ ] No hanging tests
- [ ] No memory leaks

### Database Performance
- [ ] Queries execute quickly
- [ ] No slow query warnings
- [ ] Connection pool healthy
- [ ] No connection leaks

## Documentation Checklist

### Files Present
- [ ] `tests/README.md` - Comprehensive documentation
- [ ] `tests/INSTALLATION.md` - Setup guide
- [ ] `tests/QUICK_START.md` - Quick reference
- [ ] `tests/TEST_FLOW_DIAGRAM.md` - Visual flow
- [ ] `tests/VERIFICATION_CHECKLIST.md` - This file

### Documentation Accuracy
- [ ] Commands work as documented
- [ ] Examples are correct
- [ ] Troubleshooting steps are valid
- [ ] Prerequisites are complete

## Final Verification

### All Systems Go
- [ ] All 17 tests pass
- [ ] Database cleanup works
- [ ] Coverage report generated
- [ ] No errors or warnings
- [ ] Documentation complete
- [ ] CI/CD ready

### Sign-Off
```
Date: _______________
Tester: _______________
Environment: _______________
Result: PASS / FAIL
Notes: _______________________________________________
```

## Quick Verification Script

```bash
#!/bin/bash
# Quick verification script

echo "Running verification checks..."

# Check PostgreSQL
pg_isready || { echo "❌ PostgreSQL not running"; exit 1; }
echo "✅ PostgreSQL running"

# Check database
psql -d berthcare -c "SELECT 1" > /dev/null 2>&1 || { echo "❌ Database not accessible"; exit 1; }
echo "✅ Database accessible"

# Check migrations
psql -d berthcare -c "SELECT 1 FROM visits LIMIT 1" > /dev/null 2>&1 || { echo "❌ Migrations not applied"; exit 1; }
echo "✅ Migrations applied"

# Check dependencies
[ -d "node_modules/jest" ] || { echo "❌ Dependencies not installed"; exit 1; }
echo "✅ Dependencies installed"

# Run tests
npm run test:integration || { echo "❌ Tests failed"; exit 1; }
echo "✅ All tests passed"

# Check cleanup
COUNT=$(psql -d berthcare -t -c "SELECT COUNT(*) FROM users WHERE email LIKE 'test-%'")
[ "$COUNT" -eq 0 ] || { echo "❌ Test data not cleaned up"; exit 1; }
echo "✅ Test data cleaned up"

echo ""
echo "🎉 All verification checks passed!"
```

Save as `verify-tests.sh` and run with `./verify-tests.sh`

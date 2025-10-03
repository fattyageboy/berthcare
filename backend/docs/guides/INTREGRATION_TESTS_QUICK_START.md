# Integration Tests - Quick Start

## TL;DR

```bash
cd backend
npm install
npm run test:integration
```

## What Gets Tested

✅ **17 Integration Tests** covering:
- Visit retrieval with filters
- Check-in with location verification
- Documentation updates (partial & full)
- Visit completion
- Full lifecycle: scheduled → in_progress → completed

## Commands

```bash
# Run all integration tests
npm run test:integration

# Run with coverage report
npm run test:coverage

# Run in watch mode (auto-rerun on changes)
npm run test:watch

# Run all tests (unit + integration)
npm test
```

## Test Output

```
PASS  tests/integration/visit.lifecycle.test.ts
  Visit Service - Full Lifecycle Integration Tests
    GET /api/visits - Retrieve Visits
      ✓ should retrieve visits for authenticated user (XXms)
      ✓ should filter visits by status (XXms)
      ✓ should return 401 if user is not authenticated (XXms)
      ✓ should validate required query parameters (XXms)
    POST /api/visits/:id/check-in - Check In to Visit
      ✓ should successfully check in to a scheduled visit (XXms)
      ✓ should reject check-in with invalid location data (XXms)
      ✓ should reject check-in for non-scheduled visit (XXms)
      ✓ should return 404 for non-existent visit (XXms)
    POST /api/visits/:id/verify-location - Verify Location
      ✓ should verify location against client address (XXms)
    PUT /api/visits/:id/documentation - Update Documentation
      ✓ should update visit documentation (XXms)
      ✓ should support partial documentation updates (XXms)
      ✓ should add photos to visit (XXms)
      ✓ should reject documentation update for completed visit (XXms)
    POST /api/visits/:id/complete - Complete Visit
      ✓ should successfully complete a visit (XXms)
      ✓ should complete visit without optional fields (XXms)
      ✓ should reject completion for non-in-progress visit (XXms)
    Full Visit Lifecycle - End-to-End
      ✓ should complete full visit workflow (XXms)

Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
```

## Prerequisites

1. **PostgreSQL running**
   ```bash
   pg_isready
   ```

2. **Migrations applied**
   ```bash
   npm run migrate
   ```

3. **Dependencies installed**
   ```bash
   npm install
   ```

## Troubleshooting

### Tests fail immediately
→ Check database connection in `.env.test`

### "Relation does not exist" error
→ Run migrations: `npm run migrate`

### Tests timeout
→ Check PostgreSQL is running and responsive

### Module not found
→ Run `npm install` to install test dependencies

## What Each Test Does

### 1. Visit Retrieval
Tests GET /api/visits with filters, pagination, and authentication

### 2. Check-In
Tests POST /api/visits/:id/check-in with location verification

### 3. Location Verification
Tests POST /api/visits/:id/verify-location against client address

### 4. Documentation
Tests PUT /api/visits/:id/documentation with partial updates

### 5. Completion
Tests POST /api/visits/:id/complete with signature and location

### 6. Full Lifecycle
Tests complete workflow from scheduled to completed status

## Database Impact

- Tests create temporary data (prefixed with `test-`)
- All test data is cleaned up after tests complete
- Safe to run alongside development work
- Uses same database as development

## Coverage Report

After running `npm run test:coverage`:
- Console summary shows coverage percentages
- HTML report in `coverage/index.html`
- LCOV report for CI/CD in `coverage/lcov.info`

## Next Steps

1. Run tests: `npm run test:integration`
2. Check coverage: `npm run test:coverage`
3. Review HTML report: `open coverage/index.html`
4. Add more tests as needed

## Need Help?

- See `tests/README.md` for detailed documentation
- See `tests/INSTALLATION.md` for setup guide
- Check `TASK_B15_COMPLETION_SUMMARY.md` for implementation details

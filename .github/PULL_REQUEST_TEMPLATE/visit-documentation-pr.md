## Visit Documentation API Implementation

**Feature Branch:** `feat/visit-documentation`  
**Issue:** #4  
**Dependencies:** Client Management API (PR #3)  
**Estimated Effort:** 0.1 days

---

## Overview

This PR implements the Visit Documentation API as specified in the BerthCare Technical Architecture Blueprint. It includes database schema for visits, CRUD endpoints with proper authentication/authorization, real-time sync capabilities, and comprehensive testing.

---

## Implementation Checklist

### Database Schema

- [ ] **Visits Table Migration**
  - [ ] Create migration file `004_create_visits.sql`
  - [ ] Define `visits` table with all required fields:
    - id, client_id, caregiver_id
    - scheduled_start_time, scheduled_end_time
    - actual_start_time, actual_end_time
    - status (scheduled, in_progress, completed, cancelled)
    - notes, tasks_completed (JSONB)
    - photos (JSONB array of S3 URLs)
    - signature_url, created_at, updated_at
  - [ ] Add foreign key constraint to `clients` table
  - [ ] Add foreign key constraint to `users` table (caregiver)
  - [ ] Add index on `client_id`
  - [ ] Add index on `caregiver_id`
  - [ ] Add index on `scheduled_start_time`
  - [ ] Add index on `status`
  - [ ] Create rollback migration `004_create_visits_rollback.sql`
  - [ ] Run migration successfully on local database
  - [ ] Verify foreign key relationships work

### CRUD Endpoints

- [ ] **POST /v1/visits (Create Visit)**
  - [ ] Implement endpoint to create new visit
  - [ ] Validate required fields (client_id, caregiver_id, scheduled_start_time, scheduled_end_time)
  - [ ] Validate caregiver is assigned to client's zone
  - [ ] Set initial status to 'scheduled'
  - [ ] Require coordinator or admin role
  - [ ] Add integration tests:
    - Creates visit successfully with valid data
    - Validation errors return 400
    - Zone validation works
    - Non-authorized users get 403

- [ ] **GET /v1/visits (List Visits)**
  - [ ] Implement endpoint with pagination (default 50, max 100)
  - [ ] Add filtering by client_id, caregiver_id, status, date range
  - [ ] Return visit summary with client and caregiver names
  - [ ] Require JWT authentication
  - [ ] Add integration tests:
    - Returns paginated visits
    - Filtering works correctly
    - Unauthorized access returns 401

- [ ] **GET /v1/visits/:visitId (Get Visit Details)**
  - [ ] Implement endpoint to fetch full visit details
  - [ ] Include client information
  - [ ] Include caregiver information
  - [ ] Include all photos and signature
  - [ ] Require JWT authentication
  - [ ] Add integration tests:
    - Returns full visit data
    - 404 for non-existent visit
    - Caching works

- [ ] **PATCH /v1/visits/:visitId (Update Visit)**
  - [ ] Implement endpoint to update visit details
  - [ ] Support status transitions (scheduled → in_progress → completed)
  - [ ] Support adding notes, tasks_completed, photos
  - [ ] Support adding signature_url
  - [ ] Validate status transitions
  - [ ] Require caregiver (own visits) or coordinator/admin role
  - [ ] Add integration tests:
    - Updates visit successfully
    - Status transitions validated
    - 403 for unauthorized updates
    - 404 for non-existent visit

### Real-time Sync

- [ ] **WebSocket or Server-Sent Events for real-time updates**
  - [ ] Implement real-time notification when visit status changes
  - [ ] Notify coordinators when visit starts/completes
  - [ ] Notify family members when visit completes (if enabled)

### Security & Authorization

- [ ] All endpoints require JWT authentication
- [ ] Caregivers can only update their own visits
- [ ] Coordinators/admins can manage all visits in their zones
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (parameterized queries)
- [ ] Rate limiting configured

### Testing

- [ ] Unit tests for all service functions
- [ ] Integration tests for all endpoints
- [ ] Test coverage ≥80%
- [ ] Edge cases covered:
  - Invalid input data
  - Invalid status transitions
  - Unauthorized access attempts
  - Database connection errors

### Documentation

- [ ] API endpoint documentation
- [ ] Database schema documented in migration files
- [ ] Code comments for complex business logic
- [ ] Update MIGRATION_SUMMARY.md with new migrations

### Code Quality

- [ ] ESLint passes with no errors
- [ ] Prettier formatting applied
- [ ] TypeScript type checks pass
- [ ] No console.log statements (use Winston logger)
- [ ] Error handling follows project standards

### CI/CD

- [ ] All CI checks pass (ESLint, Prettier, TypeScript, tests)
- [ ] No security vulnerabilities
- [ ] Branch up to date with `main`

---

## Testing Instructions

### Local Setup

```bash
# Start local services
docker-compose up -d

# Run migrations
npm run migrate:up

# Start backend server
cd apps/backend
npm run dev
```

### Manual Testing

```bash
# 1. Create a visit (coordinator/admin only)
curl -X POST http://localhost:3000/v1/visits \
  -H "Authorization: Bearer YOUR_COORDINATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "CLIENT_ID",
    "caregiver_id": "CAREGIVER_ID",
    "scheduled_start_time": "2025-10-12T09:00:00Z",
    "scheduled_end_time": "2025-10-12T10:00:00Z"
  }'

# 2. List visits
curl http://localhost:3000/v1/visits \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Get visit details
curl http://localhost:3000/v1/visits/VISIT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Update visit (start visit)
curl -X PATCH http://localhost:3000/v1/visits/VISIT_ID \
  -H "Authorization: Bearer YOUR_CAREGIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "actual_start_time": "2025-10-12T09:05:00Z"
  }'

# 5. Complete visit
curl -X PATCH http://localhost:3000/v1/visits/VISIT_ID \
  -H "Authorization: Bearer YOUR_CAREGIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "actual_end_time": "2025-10-12T10:15:00Z",
    "notes": "Visit completed successfully. Client in good spirits.",
    "tasks_completed": [
      {"task": "Medication administered", "completed": true},
      {"task": "Meal prepared", "completed": true}
    ]
  }'
```

### Run Tests

```bash
# Run all tests
npm test

# Run visit tests only
npm test -- apps/backend/tests/visits

# Check test coverage
npm run test:coverage
```

---

## Performance Considerations

- [ ] Database queries optimized with proper indexes
- [ ] Pagination prevents large result sets
- [ ] Connection pooling configured for PostgreSQL

---

## Security Considerations

- [ ] All endpoints require authentication
- [ ] Caregivers can only update their own visits
- [ ] Role-based authorization for admin/coordinator actions
- [ ] Input validation prevents injection attacks
- [ ] Audit trail logs all visit modifications

---

## Rollback Plan

If issues are discovered after merge:

1. Revert the PR: `git revert MERGE_COMMIT_SHA`
2. Roll back database migration:
   ```bash
   npm run migrate:down -- 004_create_visits
   ```

---

## Review Checklist

**For Reviewers:**

- [ ] Code follows project architecture and patterns
- [ ] All acceptance criteria met
- [ ] Tests are comprehensive and pass
- [ ] Security best practices followed
- [ ] Performance considerations addressed
- [ ] Documentation is clear and complete
- [ ] No breaking changes to existing APIs
- [ ] Database migrations are reversible

---

## Related Issues

- Closes #4
- Depends on #3 (Client Management API)

---

## Merge Strategy

**Squash and merge** with commit message:
```
feat: implement visit documentation API

- Add visits database schema
- Implement CRUD endpoints for visit management
- Add real-time sync capabilities
- Add comprehensive tests (80%+ coverage)
- Add role-based authorization

Closes #4
```

# Authentication System Implementation

**Task ID:** G3 → A1-A9  
**Issue:** #2  
**Status:** 🚧 Draft - Work in Progress

---

## Overview

Implementing complete authentication and authorization system for BerthCare backend, including JWT-based authentication, role-based access control, and secure password management.

**Philosophy:** "Simplicity is the ultimate sophistication" - Secure by default, invisible to users, production-ready.

---

## Implementation Checklist

### Database Schema (A1)
- [ ] Create `users` table with proper fields (id, email, password_hash, first_name, last_name, role, zone_id)
- [ ] Create `refresh_tokens` table (id, user_id, token_hash, device_id, expires_at)
- [ ] Add indexes on email and zone_id
- [ ] Run migration and verify schema

### Password Security (A2)
- [ ] Implement bcrypt password hashing (cost factor 12)
- [ ] Create `hashPassword()` function
- [ ] Create `verifyPassword()` function
- [ ] Add unit tests for password utilities
- [ ] Verify timing attack resistance

### JWT Token Management (A3)
- [ ] Implement JWT token generation with RS256
- [ ] Create `generateAccessToken()` (1 hour expiry)
- [ ] Create `generateRefreshToken()` (30 days expiry)
- [ ] Include user id, role, zone_id in payload
- [ ] Support key rotation
- [ ] Add unit tests for token utilities

### Authentication Endpoints

#### Registration (A4)
- [ ] Implement `POST /v1/auth/register` endpoint
- [ ] Validate email format
- [ ] Validate password strength (min 8 chars, 1 uppercase, 1 number)
- [ ] Hash password before storage
- [ ] Return access + refresh tokens
- [ ] Implement rate limiting (5 attempts/hour per IP)
- [ ] Add integration tests

#### Login (A5)
- [ ] Implement `POST /v1/auth/login` endpoint
- [ ] Validate credentials
- [ ] Verify password with bcrypt
- [ ] Generate access + refresh tokens
- [ ] Store refresh token hash in database
- [ ] Implement rate limiting (10 attempts/hour per IP)
- [ ] Add integration tests

#### Token Refresh (A6)
- [ ] Implement `POST /v1/auth/refresh` endpoint
- [ ] Validate refresh token
- [ ] Check token exists in database and not expired
- [ ] Generate new access token
- [ ] Return new access token
- [ ] Add integration tests

#### Logout (A9)
- [ ] Implement `POST /v1/auth/logout` endpoint
- [ ] Invalidate refresh token in database
- [ ] Add access token to Redis blacklist
- [ ] Return success response
- [ ] Add integration tests

### Middleware (A7-A8)

#### JWT Authentication Middleware (A7)
- [ ] Create middleware to verify JWT on protected routes
- [ ] Extract user from token
- [ ] Attach user to `req.user`
- [ ] Handle expired tokens (401)
- [ ] Handle invalid tokens (401)
- [ ] Implement token blacklist using Redis
- [ ] Add unit tests

#### Role-Based Authorization Middleware (A8)
- [ ] Create middleware to check user role
- [ ] Support multiple roles per endpoint
- [ ] Return 403 for insufficient permissions
- [ ] Add unit tests

---

## Security Checklist

- [ ] All passwords hashed with bcrypt (cost factor 12)
- [ ] JWT tokens use RS256 algorithm
- [ ] Refresh tokens stored as hashes in database
- [ ] Rate limiting on all auth endpoints
- [ ] Token blacklist for logout
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection (token-based)

---

## Testing Checklist

- [ ] Unit tests for password hashing utilities
- [ ] Unit tests for JWT token utilities
- [ ] Unit tests for authentication middleware
- [ ] Unit tests for authorization middleware
- [ ] Integration tests for registration endpoint
- [ ] Integration tests for login endpoint
- [ ] Integration tests for refresh endpoint
- [ ] Integration tests for logout endpoint
- [ ] Test coverage ≥80%

---

## Code Quality Checklist

- [ ] ESLint: 0 errors, 0 warnings
- [ ] TypeScript: 0 errors, strict mode enabled
- [ ] All functions properly typed
- [ ] No `any` types used
- [ ] Proper error handling with type guards
- [ ] Code compiles successfully
- [ ] All diagnostics pass

---

## Documentation Checklist

- [ ] Inline code comments for complex logic
- [ ] API endpoint documentation
- [ ] Environment variable documentation
- [ ] Migration rollback scripts
- [ ] Update architecture docs

---

## Performance Checklist

- [ ] Password hashing takes ~200ms (secure timing)
- [ ] Token generation <50ms
- [ ] Token verification <10ms
- [ ] Database queries optimized with indexes
- [ ] Redis caching for token blacklist

---

## Acceptance Criteria

### Functional Requirements
✅ Users can register with email and password  
✅ Users can login with valid credentials  
✅ Users receive JWT access token (1 hour expiry)  
✅ Users receive refresh token (30 days expiry)  
✅ Users can refresh access token with valid refresh token  
✅ Users can logout (tokens invalidated)  
✅ Protected routes require valid JWT  
✅ Role-based access control works correctly  

### Security Requirements
✅ Passwords hashed with bcrypt (cost factor 12)  
✅ JWT tokens use RS256 algorithm  
✅ Refresh tokens stored as hashes  
✅ Rate limiting prevents brute force attacks  
✅ Token blacklist prevents reuse after logout  
✅ Input validation prevents injection attacks  

### Quality Requirements
✅ Test coverage ≥80%  
✅ ESLint: 0 errors, 0 warnings  
✅ TypeScript: 0 errors  
✅ All diagnostics pass  
✅ Code review approved by 2+ reviewers  

---

## Dependencies

- **Upstream:** G2 (Backend scaffold merged)
- **Downstream:** G4 (CI, review, merge)
- **Blocks:** C1 (Client management requires auth)

---

## References

- Architecture Blueprint: `project-documentation/architecture-output.md` - Authentication section
- Task Plan: `project-documentation/task-plan.md` - Phase A tasks
- G2 Completion: `docs/G2-completion-summary.md` - Backend scaffold baseline

---

## Estimated Timeline

| Task | Effort | Status |
|------|--------|--------|
| A1 - Database schema | 0.5d | ⏳ Pending |
| A2 - Password hashing | 0.5d | ⏳ Pending |
| A3 - JWT tokens | 1d | ⏳ Pending |
| A4 - Registration | 1.5d | ⏳ Pending |
| A5 - Login | 1.5d | ⏳ Pending |
| A6 - Refresh | 1d | ⏳ Pending |
| A7 - Auth middleware | 1d | ⏳ Pending |
| A8 - Authorization middleware | 0.5d | ⏳ Pending |
| A9 - Logout | 0.5d | ⏳ Pending |
| **Total** | **8d** | |

---

## Notes

- Admin-only registration for MVP (nurses added by admin)
- RS256 algorithm requires key pair (store private key in AWS Secrets Manager)
- Token blacklist uses Redis with TTL = token expiry
- Rate limiting uses Redis for distributed rate limiting
- All timestamps in UTC
- Canadian data residency (ca-central-1)

---

**Status:** 🚧 Draft PR - Ready for implementation

**Next Steps:**
1. Implement A1 - Database schema
2. Implement A2 - Password hashing
3. Continue through A3-A9
4. Run tests and CI checks
5. Request review from senior backend + security engineer
6. Address feedback
7. Merge to main

# Pull Request: User Authentication and RBAC System

## Title
`feat: Implement comprehensive user authentication and RBAC system`

## Description

This PR implements a complete user authentication system with role-based access control (RBAC) for the BerthCare platform. It includes JWT-based authentication, Auth0 integration, device token management, and comprehensive middleware for authorization.

## Summary

This PR implements **Task B7-B10 - User Service Authentication** by establishing:
- JWT-based authentication with access and refresh tokens
- Auth0 integration for enterprise authentication
- Role-based access control (RBAC) with granular permissions
- Device token management for secure multi-device support
- Comprehensive authentication and authorization middleware
- Complete test coverage (126 unit tests passing)

## Changes Included

### Authentication Services

#### Auth Service (`backend/src/services/user/auth.service.ts`)
- User login with local credentials or Auth0
- JWT access token generation (1-hour expiration)
- JWT refresh token generation (30-day expiration)
- Token refresh with device binding validation
- Access token validation and user lookup

#### Auth0 Service (`backend/src/services/user/auth0.service.ts`)
- Auth0 SDK integration
- Credential verification via Resource Owner Password Grant
- Auth0 configuration validation
- Token validation support

#### Device Service (`backend/src/services/user/device.service.ts`)
- Device token storage with bcrypt hashing
- Device token verification
- Device usage tracking
- Expired token cleanup
- Multi-device management per user

### Security Utilities

#### JWT Utils (`backend/src/shared/utils/jwt.utils.ts`)
- Access token generation with 1-hour expiration
- Refresh token generation with 30-day expiration
- Token verification with issuer/audience validation
- Token expiration checking
- Token decoding utilities

#### Password Utils (`backend/src/shared/utils/password.utils.ts`)
- bcrypt password hashing (10 rounds)
- Secure password comparison
- Password strength validation

### Middleware

#### Authentication Middleware (`backend/src/middleware/auth.ts`)
- `authenticate`: Require valid JWT access token
- `optionalAuth`: Attach user if token present, continue otherwise
- Bearer token extraction and validation
- User lookup and attachment to request

#### RBAC Middleware (`backend/src/middleware/rbac.ts`)
- `requireRole`: Enforce role-based access
- `requirePermission`: Enforce permission-based access
- `requireAllPermissions`: Require multiple permissions
- `requireOwnResource`: Ensure user accesses only their resources
- `requireSameOrganization`: Enforce organization-level access
- `requireRoleOrPermission`: Flexible role or permission check
- Helper functions for permission checking

### Type Definitions

#### Auth Types (`backend/src/shared/types/auth.types.ts`)
- `TokenPayload`: JWT token structure
- `LoginRequest`: Login credentials
- `LoginResponse`: Authentication response with tokens
- `RefreshTokenRequest`: Token refresh request
- `RefreshTokenResponse`: New access token response
- `AuthenticatedUser`: User info attached to requests

#### RBAC Types (`backend/src/shared/types/rbac.types.ts`)
- `Role`: System roles (admin, nurse, doctor, family_member, patient)
- `Permission`: Granular permissions (40+ defined)
- `RolePermissions`: Role-to-permission mappings
- `ResourceOwnership`: Resource ownership validation

### Database Schema

#### Device Tokens Table (`backend/migrations/001_create_device_tokens.sql`)
```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, device_id)
);
```

### Configuration

#### Environment Variables
- `JWT_SECRET`: Secret key for JWT signing
- `AUTH0_DOMAIN`: Auth0 tenant domain
- `AUTH0_CLIENT_ID`: Auth0 application client ID
- `AUTH0_CLIENT_SECRET`: Auth0 application client secret

### Testing

#### Unit Tests (126 tests, all passing)
- **Auth Service Tests** (17 tests)
  - Login with local credentials
  - Login with Auth0
  - Token refresh with device binding
  - Access token validation
  - Error handling for invalid credentials

- **Auth0 Service Tests** (11 tests)
  - Configuration validation
  - Credential verification
  - Token validation
  - Error handling

- **Device Service Tests** (19 tests)
  - Token storage and retrieval
  - Token verification
  - Usage tracking
  - Token cleanup
  - Multi-device management

- **JWT Utils Tests** (23 tests)
  - Access token generation
  - Refresh token generation
  - Token verification
  - Expiration checking
  - Error handling

- **Auth Middleware Tests** (16 tests)
  - Token authentication
  - Optional authentication
  - Error handling
  - User lookup

- **RBAC Middleware Tests** (32 tests)
  - Role-based access control
  - Permission-based access control
  - Resource ownership validation
  - Organization-level access control
  - Combined role/permission checks

- **Password Utils Tests** (8 tests)
  - Password hashing
  - Password comparison
  - Strength validation

## Security Features

### Authentication Security
- JWT tokens with short expiration (1 hour for access, 30 days for refresh)
- Secure token signing with configurable secret
- Issuer and audience validation
- Device binding for refresh tokens
- bcrypt password hashing (10 rounds)

### Authorization Security
- Role-based access control (RBAC)
- Granular permission system (40+ permissions)
- Resource ownership validation
- Organization-level access control
- Flexible authorization patterns

### Token Security
- Device token hashing with bcrypt
- Automatic token expiration
- Token cleanup for expired tokens
- Multi-device support with device binding
- Last-used tracking for security auditing

## Pre-Merge Checklist

### Code Quality
- [x] ESLint checks pass
- [x] TypeScript type checking passes
- [x] Code follows project conventions
- [x] No code smells or technical debt introduced

### Testing
- [x] Unit tests pass (126/126)
- [x] Test coverage meets project standards (>80%)
- [x] Edge cases considered and tested
- [x] Error handling thoroughly tested

### Security
- [x] Password hashing implemented with bcrypt
- [x] JWT tokens properly signed and validated
- [x] Device tokens securely hashed
- [x] No secrets or credentials committed
- [x] Auth0 configuration follows security best practices
- [x] RBAC permissions properly defined

### Documentation
- [x] Code thoroughly commented
- [x] Type definitions documented
- [x] Middleware usage documented
- [x] Environment variables documented

### CI/CD
- [x] All linting errors resolved
- [x] All type errors resolved
- [x] All unit tests passing
- [ ] CI pipeline passes (pending GitHub Actions run)

## Testing Instructions

### Local Testing

1. **Set up environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   # Add JWT_SECRET and Auth0 credentials
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run database migrations:**
   ```bash
   npm run migrate
   ```

4. **Run unit tests:**
   ```bash
   npm run test:unit
   ```

5. **Run linting:**
   ```bash
   npm run lint
   ```

6. **Run type checking:**
   ```bash
   npm run type-check
   ```

### Manual Testing

1. **Test login endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123"}'
   ```

2. **Test token refresh:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken":"<token>","deviceId":"device-123"}'
   ```

3. **Test protected endpoint:**
   ```bash
   curl -X GET http://localhost:3000/api/protected \
     -H "Authorization: Bearer <access-token>"
   ```

## Dependencies

### External Services
- **Auth0** (optional): Enterprise authentication provider
- **PostgreSQL**: Database for user and device token storage
- **Redis** (future): Session management and token blacklisting

### NPM Packages
- `jsonwebtoken`: JWT token generation and verification
- `bcrypt`: Password and token hashing
- `auth0`: Auth0 SDK for enterprise authentication
- `express-validator`: Request validation

## Related Issues

- Implements: Task B7 - User Service Authentication
- Implements: Task B8 - JWT Token Management
- Implements: Task B9 - RBAC Implementation
- Implements: Task B10 - Authentication Middleware
- Related to: Task B11 - CI/CD and PR Merge

## Deployment Notes

### Database Migrations
Run the following migration before deploying:
```bash
npm run migrate
```

### Environment Variables
Ensure the following environment variables are set:
- `JWT_SECRET`: Strong random secret (minimum 32 characters)
- `AUTH0_DOMAIN`: Auth0 tenant domain (if using Auth0)
- `AUTH0_CLIENT_ID`: Auth0 client ID (if using Auth0)
- `AUTH0_CLIENT_SECRET`: Auth0 client secret (if using Auth0)

### Post-Deployment
1. Verify JWT token generation works
2. Test login endpoints
3. Verify RBAC middleware functions correctly
4. Monitor for authentication errors

## Rollback Plan

If issues arise after merge:
1. Revert the PR merge commit
2. Roll back database migration: `npm run migrate:down`
3. Verify system returns to previous state
4. Investigate and fix issues before re-deploying

## Performance Considerations

- JWT token verification is stateless and fast
- bcrypt hashing uses 10 rounds (balanced security/performance)
- Device token lookup uses indexed queries
- Token expiration cleanup can be run as scheduled job

## Future Enhancements

- [ ] Redis-based token blacklisting
- [ ] Multi-factor authentication (MFA)
- [ ] OAuth2 social login providers
- [ ] Session management with Redis
- [ ] Rate limiting for authentication endpoints
- [ ] Audit logging for authentication events
- [ ] Password reset functionality
- [ ] Email verification

## Additional Context

This PR establishes the authentication and authorization foundation for the BerthCare platform. All subsequent API endpoints will use these authentication and RBAC middleware components to secure access.

The implementation follows industry best practices:
- OWASP authentication guidelines
- JWT best practices (short expiration, secure signing)
- bcrypt for password hashing
- Role-based access control patterns
- Defense in depth with multiple security layers

---

**Estimated Effort:** 1.5 days (as per specification)

**Type:** Feature
**Priority:** High
**Component:** Backend Authentication

**Test Coverage:** 126 unit tests, all passing

---

**Ready for Review:** ✅
**CI Status:** Pending
**Merge Strategy:** Squash and merge


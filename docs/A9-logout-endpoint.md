# A9: Implement POST /v1/auth/logout Endpoint

**Task ID**: A9  
**Priority**: High  
**Estimated Effort**: 0.5 days  
**Dependencies**: A8 (Role Authorization Middleware)  
**Status**: In Progress

## Overview

Implement secure logout functionality that invalidates both access and refresh tokens, ensuring users can safely terminate their sessions and prevent token reuse.

## Acceptance Criteria

- [x] Endpoint accepts valid JWT access token in Authorization header
- [x] Access token is added to Redis blacklist with TTL matching token expiry
- [ ] Refresh token is invalidated in database (set revoked_at timestamp)
- [ ] Returns success response with appropriate status code
- [ ] Handles missing or invalid tokens gracefully
- [ ] Integration tests verify token invalidation
- [ ] Subsequent requests with logged-out tokens fail with 401

## Technical Specification

### Endpoint Details

**Method**: POST  
**Path**: `/v1/auth/logout`  
**Authentication**: Required (JWT access token)

### Request Format

**Headers**:

```
Authorization: Bearer <access_token>
```

**Body**: None

### Response Format

**Success Response (200)**:

```json
{
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Error Responses**:

401 Unauthorized - Missing token:

```json
{
  "error": {
    "code": "MISSING_TOKEN",
    "message": "Authorization header is required",
    "timestamp": "2025-10-10T12:00:00.000Z",
    "requestId": "req_123"
  }
}
```

401 Unauthorized - Invalid token format:

```json
{
  "error": {
    "code": "INVALID_TOKEN_FORMAT",
    "message": "Authorization header must be in format: Bearer <token>",
    "timestamp": "2025-10-10T12:00:00.000Z",
    "requestId": "req_123"
  }
}
```

500 Internal Server Error:

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An error occurred during logout",
    "timestamp": "2025-10-10T12:00:00.000Z",
    "requestId": "req_123"
  }
}
```

## Implementation Details

### Token Invalidation Strategy

#### 1. Access Token Blacklisting (Redis)

- Extract access token from Authorization header
- Add token to Redis blacklist with key: `token:blacklist:<token>`
- Set TTL to 3600 seconds (1 hour) to match access token expiry
- Blacklisted tokens are checked by `authenticateJWT` middleware

#### 2. Refresh Token Revocation (PostgreSQL)

- Decode access token to extract userId
- Find all active refresh tokens for the user
- Set `revoked_at` timestamp to current time
- Revoked tokens cannot be used for token refresh

### Security Considerations

1. **Immediate Invalidation**: Both tokens are invalidated immediately upon logout
2. **No Grace Period**: Logged-out tokens cannot be used for any subsequent requests
3. **Multi-Device Support**: Logout invalidates tokens on current device only (future enhancement)
4. **Audit Trail**: Revocation timestamps provide audit trail for security investigations
5. **Timing Attack Prevention**: Blacklist tokens even if invalid to prevent timing attacks

### Database Operations

**Query to revoke refresh tokens**:

```sql
UPDATE refresh_tokens
SET revoked_at = CURRENT_TIMESTAMP
WHERE user_id = $1
  AND revoked_at IS NULL
  AND expires_at > CURRENT_TIMESTAMP
```

### Redis Operations

**Blacklist access token**:

```typescript
const blacklistKey = `token:blacklist:${token}`;
await redisClient.setEx(blacklistKey, 3600, '1');
```

## Testing Requirements

### Unit Tests

1. **Success Cases**:
   - Logout with valid token returns 200
   - Access token is added to Redis blacklist
   - Refresh token is revoked in database
   - Blacklist TTL is set correctly (3600 seconds)

2. **Error Cases**:
   - Missing Authorization header returns 401
   - Invalid Authorization format returns 401
   - Invalid token is still blacklisted (timing attack prevention)

3. **Integration Tests**:
   - Logged-out access token cannot access protected routes
   - Logged-out refresh token cannot refresh access token
   - Multiple logout calls are idempotent
   - Logout on one device doesn't affect other devices (future)

### Test Data

**Valid Test User**:

```json
{
  "userId": "user_123",
  "email": "test@example.com",
  "role": "caregiver",
  "zoneId": "zone_456"
}
```

## Error Handling

1. **Missing Token**: Return 401 with clear error message
2. **Invalid Token Format**: Return 401 with format guidance
3. **Redis Connection Error**: Log error, return 500 (logout still succeeds partially)
4. **Database Error**: Log error, return 500 (access token still blacklisted)
5. **Token Decode Error**: Blacklist token anyway (timing attack prevention)

## Performance Considerations

1. **Redis Operations**: O(1) complexity for token blacklist
2. **Database Operations**: Indexed query on user_id for fast token revocation
3. **Concurrent Logouts**: Safe due to idempotent operations
4. **Memory Usage**: Redis keys expire automatically after 1 hour

## Future Enhancements

1. **Device-Specific Logout**: Revoke only tokens for current device
2. **Logout All Devices**: Endpoint to revoke all user tokens
3. **Token Rotation**: Issue new refresh token on each use
4. **Session Management**: UI to view and revoke active sessions
5. **Logout Notifications**: Notify user of logout events

## References

- Architecture Blueprint: Authentication section
- Task A3: JWT Token Generation
- Task A7: JWT Authentication Middleware
- Task A8: Role Authorization Middleware
- OWASP Authentication Cheat Sheet

## Philosophy

**"Uncompromising Security"**

Logout is a critical security feature. Users must be able to terminate sessions immediately and completely. No grace periods, no partial invalidation, no compromises.

- Immediate token invalidation
- Multiple layers of protection (Redis + Database)
- Clear audit trail for security investigations
- Timing attack prevention
- Idempotent operations for reliability

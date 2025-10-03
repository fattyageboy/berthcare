# Authentication Implementation (Task B8)

## Overview

This document describes the implementation of user authentication endpoints for the BerthCare backend. The implementation includes secure JWT token generation, Auth0 integration, device binding for security, and rate limiting.

## Endpoints

### POST /auth/login

Authenticates a user and returns JWT tokens bound to a specific device.

**URL**: `http://localhost:3001/auth/login`

**Method**: `POST`

**Request Body**:
```json
{
  "email": "nurse@example.com",
  "password": "securePassword123",
  "device_id": "unique-device-identifier",
  "device_type": "ios"
}
```

**Field Validation**:
- `email`: Required, must be valid email format
- `password`: Required, minimum 8 characters
- `device_id`: Required, 1-255 characters
- `device_type`: Required, must be one of: `ios`, `android`, `web`

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "nurse@example.com",
      "first_name": "Jane",
      "last_name": "Doe",
      "role": "nurse",
      "organization_id": "uuid"
    },
    "expires_in": 3600
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation failed or missing required fields
- `401 Unauthorized`: Invalid email or password
- `429 Too Many Requests`: Rate limit exceeded (10 requests per minute)
- `500 Internal Server Error`: Server error

### POST /auth/refresh

Refreshes an access token using a valid refresh token and device binding.

**URL**: `http://localhost:3001/auth/refresh`

**Method**: `POST`

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "device_id": "unique-device-identifier"
}
```

**Field Validation**:
- `refresh_token`: Required
- `device_id`: Required, must match the device ID used during login

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "nurse@example.com",
      "first_name": "Jane",
      "last_name": "Doe",
      "role": "nurse",
      "organization_id": "uuid"
    },
    "expires_in": 3600
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation failed or missing required fields
- `401 Unauthorized`: Invalid or expired refresh token, device ID mismatch, or invalid device binding
- `404 Not Found`: User not found
- `429 Too Many Requests`: Rate limit exceeded (10 requests per minute)
- `500 Internal Server Error`: Server error

## Technical Implementation

### JWT Token Management

**Access Tokens**:
- Expiration: 1 hour
- Contains: userId, email, role, organizationId, deviceId, type
- Used for API authentication

**Refresh Tokens**:
- Expiration: 30 days
- Contains: Same payload as access token
- Used only for token refresh
- Automatically rotated on each refresh

**Token Payload Structure**:
```typescript
{
  userId: string;
  email: string;
  role: string;
  organizationId: string | null;
  deviceId: string;
  type: 'access' | 'refresh';
  iat: number;  // issued at (added by JWT)
  exp: number;  // expiration (added by JWT)
  iss: 'berthcare-auth';  // issuer
  aud: 'berthcare-api';  // audience
}
```

### Device Binding

Device binding enhances security by tying refresh tokens to specific devices:

1. **Token Storage**: When a user logs in, a hashed refresh token is stored in the `device_tokens` table with the device ID
2. **Verification**: During token refresh, the system verifies:
   - The refresh token hash matches
   - The device ID matches
   - The token hasn't expired
3. **Rotation**: Refresh tokens are rotated on each use
4. **Expiration**: Device tokens automatically expire after 30 days

**Database Schema** (`device_tokens` table):
```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  device_id VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE (device_id, user_id)
);
```

### Auth0 Integration

The system supports two authentication modes:

1. **Auth0 Mode** (when configured):
   - Validates credentials through Auth0 SDK
   - Uses Resource Owner Password Grant flow
   - Retrieves user profile from Auth0
   - Falls back to local database for user information

2. **Local Mode** (fallback):
   - Validates credentials using bcrypt password hashing
   - Uses local database exclusively

**Configuration**: Set these environment variables to enable Auth0:
```env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
```

If any Auth0 variable is missing, the system automatically falls back to local authentication.

### Rate Limiting

Rate limiting protects authentication endpoints from brute force attacks:

- **Limit**: 10 requests per minute per IP address
- **Storage**: Redis-backed for distributed rate limiting
- **Headers**: Returns `RateLimit-*` headers with limit information
- **Error Response**: Returns 429 status with clear error message
- **Testing**: Rate limiting is automatically disabled in test environment

### Input Validation

All endpoints use `express-validator` for comprehensive input validation:

- Email format validation
- Password length requirements (minimum 8 characters)
- Device ID length constraints
- Device type enumeration validation
- Automatic input sanitization and normalization

### Error Handling

Comprehensive error handling with appropriate HTTP status codes:

- `400`: Validation errors or bad requests
- `401`: Authentication failures (invalid credentials, expired tokens)
- `404`: Resource not found (user doesn't exist)
- `429`: Rate limit exceeded
- `500`: Internal server errors

All errors return a consistent JSON structure:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Security Features

1. **JWT Secret**: Must be a secure random string (minimum 32 characters recommended)
2. **Password Hashing**: Uses bcrypt with salt rounds of 10
3. **Token Hashing**: Refresh tokens are hashed before storage using bcrypt
4. **Device Binding**: Tokens are tied to specific devices to prevent token theft
5. **Token Rotation**: Refresh tokens are automatically rotated on each use
6. **Rate Limiting**: Protects against brute force attacks
7. **Input Validation**: Prevents injection attacks and invalid data
8. **HTTPS Required**: All authentication should occur over HTTPS in production

## Database Migration

Before using authentication, run the migration to create the `device_tokens` table:

```bash
cd backend
npm run migrate
```

This creates the necessary database schema for device binding.

## Testing the Endpoints

### Using cURL

**Login**:
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nurse@example.com",
    "password": "password123",
    "device_id": "test-device-001",
    "device_type": "web"
  }'
```

**Refresh Token**:
```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN",
    "device_id": "test-device-001"
  }'
```

### Using Postman

1. Import the endpoints into Postman
2. Set Content-Type header to `application/json`
3. Use the request body examples above
4. Save the returned tokens for subsequent requests

## File Structure

```
backend/src/
├── services/user/
│   ├── auth.routes.ts          # Authentication endpoint routes
│   ├── auth.service.ts         # Core authentication logic
│   ├── auth0.service.ts        # Auth0 SDK integration
│   ├── device.service.ts       # Device binding management
│   ├── validation.ts           # Input validation rules
│   └── index.ts                # User service entry point
├── shared/
│   ├── middleware/
│   │   └── rateLimiter.ts      # Rate limiting middleware
│   ├── types/
│   │   └── auth.types.ts       # Authentication type definitions
│   └── utils/
│       └── jwt.utils.ts        # JWT token utilities
└── migrations/
    └── 1759299623679_add-device-tokens-table.js
```

## Environment Variables

Required:
- `JWT_SECRET`: Secret key for JWT signing (change in production!)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection
- `REDIS_HOST`, `REDIS_PORT`: Redis connection for rate limiting

Optional (for Auth0):
- `AUTH0_DOMAIN`: Your Auth0 tenant domain
- `AUTH0_CLIENT_ID`: Auth0 application client ID
- `AUTH0_CLIENT_SECRET`: Auth0 application client secret

## Acceptance Criteria Verification

- [x] Login returns access and refresh tokens on success
- [x] Refresh endpoint works and returns new tokens
- [x] Invalid credentials return 401 status
- [x] Rate limiting active (10 req/min per IP)
- [x] Device binding implemented for security
- [x] Auth0 SDK integration (with local fallback)
- [x] Comprehensive error handling
- [x] Input validation on all endpoints

## Next Steps

1. Run database migrations: `npm run migrate`
2. Configure environment variables in `.env`
3. Start the user service: `npm run dev` or `ts-node src/services/user`
4. Test the endpoints using cURL or Postman
5. Configure Auth0 (optional) for production authentication

## Troubleshooting

**Database Connection Error**:
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -l`

**Redis Connection Error**:
- Ensure Redis is running: `redis-cli ping`
- Check Redis connection in `.env`

**Auth0 Errors**:
- Verify Auth0 credentials are correct
- Check Auth0 dashboard for application configuration
- Ensure Resource Owner Password Grant is enabled in Auth0
- System will fall back to local authentication if Auth0 is not configured

**Rate Limit Issues**:
- Rate limiting requires Redis to be running
- If Redis fails, requests will be allowed (fail-open behavior)
- Rate limiting is disabled in test environment

# Authentication API - Quick Reference

## POST /api/v1/auth/register

Register a new user account with email and password.

### Endpoint
```
POST https://api.berthcare.ca/api/v1/auth/register
```

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "email": "nurse@example.com",
  "password": "SecurePass123",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "nurse",
  "zoneId": "123e4567-e89b-12d3-a456-426614174000",
  "deviceId": "device-uuid-123"
}
```

### Required Fields
- `email` - Valid email address
- `password` - Min 8 chars, 1 uppercase, 1 number
- `firstName` - User's first name
- `lastName` - User's last name
- `role` - One of: 'nurse', 'coordinator', 'admin'
- `deviceId` - Unique device identifier

### Optional Fields
- `zoneId` - UUID for zone assignment (required for nurses/coordinators)

### Success Response (201)
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "nurse@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "nurse",
    "zoneId": "123e4567-e89b-12d3-a456-426614174000",
    "createdAt": "2025-10-09T12:00:00.000Z"
  }
}
```

### Error Responses

#### 400 - Validation Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "email": "Email is required",
      "password": "Password is required"
    },
    "requestId": "req-abc123"
  }
}
```

#### 400 - Invalid Email
```json
{
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Invalid email format",
    "requestId": "req-abc123"
  }
}
```

#### 400 - Weak Password
```json
{
  "error": {
    "code": "WEAK_PASSWORD",
    "message": "Password must be at least 8 characters",
    "requestId": "req-abc123"
  }
}
```

#### 409 - Email Exists
```json
{
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "An account with this email already exists",
    "requestId": "req-abc123"
  }
}
```

#### 429 - Rate Limit Exceeded
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many registration attempts. Please try again later.",
    "requestId": "req-abc123"
  }
}
```

### Rate Limiting
- **Limit:** 5 attempts per hour per IP address
- **Window:** 1 hour (3600 seconds)
- **Headers:** `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 number (0-9)

### Token Information
- **Access Token:** Expires in 1 hour
- **Refresh Token:** Expires in 30 days
- **Algorithm:** RS256 (asymmetric encryption)

### cURL Example
```bash
curl -X POST https://api.berthcare.ca/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nurse@example.com",
    "password": "SecurePass123",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "nurse",
    "deviceId": "device-uuid-123"
  }'
```

### JavaScript/TypeScript Example
```typescript
async function registerUser(userData) {
  const response = await fetch('https://api.berthcare.ca/api/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'nurse',
      deviceId: getDeviceId(),
    }),
  });

  if (response.ok) {
    const { accessToken, refreshToken, user } = await response.json();
    // Store tokens securely
    return { success: true, user };
  } else {
    const error = await response.json();
    return { success: false, error: error.error.message };
  }
}
```

### Security Notes
- Passwords are hashed using bcrypt (cost factor 12)
- Email addresses are case-insensitive and normalized
- Refresh tokens are stored as SHA-256 hashes
- All tokens use RS256 asymmetric encryption
- Rate limiting prevents brute force attacks

### Testing
```bash
# Run integration tests
npm test -- apps/backend/tests/auth.test.ts

# Test with curl (local development)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User",
    "role": "nurse",
    "deviceId": "test-device"
  }'
```

---

## POST /api/v1/auth/login

Authenticate user and issue JWT tokens.

### Endpoint
```
POST https://api.berthcare.ca/api/v1/auth/login
```

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "email": "nurse@example.com",
  "password": "SecurePass123",
  "deviceId": "device-uuid-123"
}
```

### Required Fields
- `email` - Valid email address
- `password` - User's password
- `deviceId` - Unique device identifier

### Success Response (200)
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "nurse@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "nurse",
    "zoneId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Error Responses

#### 400 - Validation Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "email": "Email is required",
      "password": "Password is required"
    },
    "requestId": "req-abc123"
  }
}
```

#### 400 - Invalid Email
```json
{
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Invalid email format",
    "requestId": "req-abc123"
  }
}
```

#### 401 - Invalid Credentials
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "requestId": "req-abc123"
  }
}
```

#### 429 - Rate Limit Exceeded
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many login attempts. Please try again later.",
    "requestId": "req-abc123"
  }
}
```

### Rate Limiting
- **Limit:** 10 attempts per hour per IP address
- **Window:** 1 hour (3600 seconds)
- **Headers:** `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

### Token Information
- **Access Token:** Expires in 1 hour
- **Refresh Token:** Expires in 30 days
- **Algorithm:** RS256 (asymmetric encryption)
- **Device Management:** One refresh token per device (old token deleted on new login)

### cURL Example
```bash
curl -X POST https://api.berthcare.ca/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nurse@example.com",
    "password": "SecurePass123",
    "deviceId": "device-uuid-123"
  }'
```

### JavaScript/TypeScript Example
```typescript
async function loginUser(email: string, password: string) {
  const response = await fetch('https://api.berthcare.ca/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      deviceId: getDeviceId(),
    }),
  });

  if (response.ok) {
    const { accessToken, refreshToken, user } = await response.json();
    // Store tokens securely
    await secureStorage.setItem('accessToken', accessToken);
    await secureStorage.setItem('refreshToken', refreshToken);
    return { success: true, user };
  } else if (response.status === 401) {
    return { success: false, error: 'Invalid email or password' };
  } else if (response.status === 429) {
    return { success: false, error: 'Too many attempts. Please try again later.' };
  } else {
    const error = await response.json();
    return { success: false, error: error.error.message };
  }
}
```

### Security Notes
- Password verification uses bcrypt constant-time comparison
- Same error message for non-existent email and wrong password (prevents user enumeration)
- Email addresses are case-insensitive and normalized
- Refresh tokens are stored as SHA-256 hashes
- Device-specific token management (one token per device)
- Rate limiting prevents brute force attacks
- All login attempts are logged for security monitoring

### Testing
```bash
# Run integration tests
npm test -- apps/backend/tests/auth.test.ts --testNamePattern="login"

# Test with curl (local development)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "deviceId": "test-device"
  }'
```


---

## POST /api/v1/auth/refresh

Refresh access token using a valid refresh token.

### Endpoint
```
POST https://api.berthcare.ca/api/v1/auth/refresh
```

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Required Fields
- `refreshToken` - Valid refresh token from login or registration

### Success Response (200)
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Responses

#### 400 - Validation Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Refresh token is required",
    "requestId": "req-abc123"
  }
}
```

#### 401 - Invalid Token
```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired refresh token",
    "requestId": "req-abc123"
  }
}
```

### Token Information
- **Access Token:** Expires in 1 hour
- **Refresh Token:** Remains valid (not replaced)
- **Algorithm:** RS256 (asymmetric encryption)
- **Multiple Refreshes:** Same refresh token can be used multiple times until expiry

### Token Validation
The endpoint performs the following validations:
1. JWT signature verification (RS256 public key)
2. JWT expiry check (30 days from issuance)
3. Database existence check (token hash lookup)
4. Database expiry check (expires_at timestamp)
5. Automatic cleanup of expired tokens

### User Data Freshness
- New access token uses current user data from database
- Reflects any role or zone changes since token issuance
- Does not trust token claims for user data

### cURL Example
```bash
curl -X POST https://api.berthcare.ca/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### JavaScript/TypeScript Example
```typescript
async function refreshAccessToken() {
  const refreshToken = await secureStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return { success: false, error: 'No refresh token' };
  }
  
  const response = await fetch('https://api.berthcare.ca/api/v1/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken,
    }),
  });

  if (response.ok) {
    const { accessToken } = await response.json();
    // Store new access token
    await secureStorage.setItem('accessToken', accessToken);
    return { success: true, accessToken };
  } else if (response.status === 401) {
    // Refresh token invalid or expired, user needs to login
    await secureStorage.removeItem('accessToken');
    await secureStorage.removeItem('refreshToken');
    return { success: false, error: 'Session expired. Please login again.' };
  } else {
    const error = await response.json();
    return { success: false, error: error.error.message };
  }
}
```

### Automatic Token Refresh on 401
```typescript
async function apiRequest(url: string, options: RequestInit = {}) {
  let accessToken = await secureStorage.getItem('accessToken');
  
  // Add access token to request
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };
  
  let response = await fetch(url, { ...options, headers });
  
  // If 401, try to refresh token and retry
  if (response.status === 401) {
    const refreshResult = await refreshAccessToken();
    
    if (refreshResult.success) {
      // Retry request with new access token
      headers['Authorization'] = `Bearer ${refreshResult.accessToken}`;
      response = await fetch(url, { ...options, headers });
    } else {
      // Refresh failed, redirect to login
      navigateToLogin();
      throw new Error('Session expired');
    }
  }
  
  return response;
}
```

### Security Notes
- JWT signature verified before database lookup (prevents information leakage)
- Same error message for all invalid token scenarios (prevents token enumeration)
- Expired tokens automatically deleted from database
- New access token uses current user data from database (not token claims)
- Refresh token remains valid after use (not single-use)
- All refresh attempts logged for security monitoring

### Testing
```bash
# Run integration tests
npm test -- apps/backend/tests/auth.test.ts --testNamePattern="refresh"

# Test with curl (local development)
# First, login to get a refresh token
LOGIN_RESPONSE=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "deviceId": "test-device"
  }')

REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.refreshToken')

# Then, use refresh token to get new access token
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }"
```

### Common Use Cases

#### Mobile App Token Refresh
```typescript
// Check if access token is expired before making API request
async function ensureValidAccessToken() {
  const accessToken = await secureStorage.getItem('accessToken');
  
  if (!accessToken || isTokenExpired(accessToken)) {
    const result = await refreshAccessToken();
    if (!result.success) {
      // Redirect to login
      navigateToLogin();
      return null;
    }
    return result.accessToken;
  }
  
  return accessToken;
}

// Use before API requests
const accessToken = await ensureValidAccessToken();
if (accessToken) {
  // Make API request with valid access token
}
```

#### Background Token Refresh
```typescript
// Refresh token periodically in background (e.g., every 30 minutes)
setInterval(async () => {
  const accessToken = await secureStorage.getItem('accessToken');
  
  // Refresh if token expires in less than 10 minutes
  if (accessToken && willExpireSoon(accessToken, 10 * 60)) {
    await refreshAccessToken();
  }
}, 30 * 60 * 1000); // Every 30 minutes
```

---

## Authentication Flow Summary

### Registration Flow
1. User submits registration form
2. POST /api/v1/auth/register
3. Receive access token + refresh token
4. Store tokens securely
5. Navigate to app

### Login Flow
1. User submits login form
2. POST /api/v1/auth/login
3. Receive access token + refresh token
4. Store tokens securely
5. Navigate to app

### Token Refresh Flow
1. Access token expires (1 hour)
2. API request returns 401
3. POST /api/v1/auth/refresh with refresh token
4. Receive new access token
5. Retry original API request
6. If refresh fails, redirect to login

### Token Lifecycle
- **Access Token:** 1 hour expiry, used for API authentication
- **Refresh Token:** 30 days expiry, used to get new access tokens
- **Device Management:** One refresh token per device
- **Multiple Refreshes:** Same refresh token can be used multiple times

---

## References

- **Architecture Blueprint:** `project-documentation/architecture-output.md`
- **Completion Summaries:** `docs/A4-completion-summary.md`, `docs/A5-completion-summary.md`, `docs/A6-completion-summary.md`
- **Implementation Status:** `docs/implementation-status.md`
- **OWASP Authentication Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **RFC 6749 - OAuth 2.0:** https://tools.ietf.org/html/rfc6749

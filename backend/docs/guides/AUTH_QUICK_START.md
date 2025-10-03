# Authentication Quick Start Guide

## Setup (5 minutes)

### 1. Run Database Migration
```bash
cd backend
npm run migrate
```

### 2. Configure Environment
Edit `backend/.env` and set:
```env
JWT_SECRET=your-secure-random-string-minimum-32-characters
```

Optional - For Auth0:
```env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
```

### 3. Start Services
```bash
# Start PostgreSQL
# Start Redis (for rate limiting)

# Start user service
cd backend
npm run dev
# or
ts-node src/services/user
```

## Quick Test

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "device_id": "test-device-001",
    "device_type": "web"
  }'
```

### Refresh Token
```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN_FROM_LOGIN",
    "device_id": "test-device-001"
  }'
```

## Response Format

Success (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "nurse",
      "organization_id": "uuid"
    },
    "expires_in": 3600
  }
}
```

Error (401):
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "Invalid email or password"
}
```

## Key Points

- **Access tokens**: 1 hour expiration, use for API calls
- **Refresh tokens**: 30 day expiration, use to get new access tokens
- **Device binding**: device_id must match between login and refresh
- **Rate limit**: 10 requests/minute per IP on auth endpoints
- **Auth0**: Optional, falls back to local bcrypt if not configured

## Troubleshooting

**Migration fails**: Ensure PostgreSQL is running and credentials are correct in `.env`

**Rate limiting not working**: Check Redis connection

**401 on refresh**: Verify device_id matches the one used during login

**Auth0 errors**: System will fall back to local authentication if Auth0 is misconfigured

## Next Steps

See `/Users/opus/Desktop/Berthcare/backend/docs/AUTHENTICATION.md` for complete documentation.

# BerthCare Backend Architecture - Living Documentation

**Version:** 1.0.0  
**Last Updated:** January 3, 2025  
**Status:** ✅ Production Ready

This is a living document that reflects the as-built architecture of the BerthCare backend system. It is updated with each significant change to maintain accuracy.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Service Architecture](#service-architecture)
3. [Database Schema](#database-schema)
4. [Authentication & Authorization](#authentication--authorization)
5. [API Reference](#api-reference)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Security Architecture](#security-architecture)
8. [Infrastructure](#infrastructure)
9. [Deployment](#deployment)

---

## System Overview

### Architecture Style
**Microservices Architecture** with independent services communicating via HTTP/REST and WebSocket protocols.

### Technology Stack
- **Runtime:** Node.js 18+ with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL 14+ with connection pooling (PgBouncer)
- **Cache:** Redis 7+
- **Authentication:** Auth0 (JWT tokens)
- **File Storage:** AWS S3 with server-side encryption
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Email:** AWS SES
- **Real-time:** Socket.io (WebSocket)

### Design Principles
1. **Separation of Concerns:** Each service handles a specific domain
2. **Type Safety:** Full TypeScript coverage with strict mode
3. **Security First:** Encryption at rest and in transit, RBAC, input validation
4. **Testability:** Comprehensive unit and integration tests
5. **Observability:** Structured logging, health checks, monitoring endpoints

---

## Service Architecture

### Service Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway / Load Balancer               │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ User Service │    │Visit Service │    │ Sync Service │
│   Port 3001  │    │  Port 3002   │    │  Port 3003   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────────────────────────────────────────────┐
│              PostgreSQL Database (Port 5432)          │
│              Redis Cache (Port 6379)                  │
└──────────────────────────────────────────────────────┘
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Notification  │    │Email Service │    │File Upload   │
│   Service    │    │              │    │   Service    │
│  Port 3004   │    │ (Embedded)   │    │ (Embedded)   │
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│     FCM      │    │   AWS SES    │    │   AWS S3     │
│  (External)  │    │  (External)  │    │  (External)  │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Service Details

#### 1. User Service (Port 3001)
**Purpose:** User authentication, authorization, and profile management

**Responsibilities:**
- JWT token validation and refresh
- User RBAC (Role-Based Access Control)
- User profile CRUD operations
- Organization management
- Device registration for mobile apps

**Dependencies:**
- PostgreSQL (users, roles, permissions tables)
- Redis (session caching, token blacklist)
- Auth0 (external authentication provider)

**Key Endpoints:**
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh
- `GET /api/users/me` - Get current user profile
- `GET /api/users` - List users (admin)
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/role` - Assign role

#### 2. Visit Service (Port 3002)
**Purpose:** Visit scheduling, tracking, and documentation

**Responsibilities:**
- Visit lifecycle management (scheduled → in-progress → completed)
- GPS location verification (100m urban, 500m rural)
- Visit documentation and care activity tracking
- Photo uploads with encryption
- Visit reports and analytics

**Dependencies:**
- PostgreSQL (visits, photos, care_activities tables)
- AWS S3 (encrypted photo storage)
- Google Maps API (geocoding and location verification)

**Key Endpoints:**
- `GET /api/visits` - List visits with filters
- `POST /api/visits/:id/check-in` - Check in to visit
- `POST /api/visits/:id/documentation` - Update visit documentation
- `POST /api/visits/:id/complete` - Complete visit
- `POST /api/uploads/photo` - Upload visit photo

#### 3. Sync Service (Port 3003)
**Purpose:** Offline data synchronization and real-time updates

**Responsibilities:**
- Conflict-free data synchronization
- Last-write-wins conflict resolution
- Real-time WebSocket connections
- Change broadcasting to connected clients
- Sync state management

**Dependencies:**
- PostgreSQL (sync_state, sync_conflicts tables)
- Socket.io (WebSocket server)
- Redis (connection state management)

**Key Endpoints:**
- `POST /api/sync/pull` - Pull server changes
- `POST /api/sync/push` - Push local changes
- `WS /socket.io` - WebSocket connection

**WebSocket Events:**
- `authenticate` - Client authentication
- `entity:changed` - Entity update broadcast
- `sync:complete` - Sync completion notification

#### 4. Notification Service (Port 3004)
**Purpose:** Push notifications and user preferences

**Responsibilities:**
- FCM push notification delivery
- Device token management
- Notification preferences (quiet hours, type filtering)
- Notification history and read status
- Multi-device support

**Dependencies:**
- PostgreSQL (notifications, push_notification_tokens, notification_preferences tables)
- Firebase Cloud Messaging (push delivery)

**Key Endpoints:**
- `POST /api/notifications/tokens` - Register device token
- `POST /api/notifications/send` - Send notification
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences

#### 5. Email Service (Embedded)
**Purpose:** Transactional email delivery and tracking

**Responsibilities:**
- Template-based email generation
- AWS SES integration
- Bounce and complaint handling
- Email suppression list management
- Delivery statistics

**Dependencies:**
- PostgreSQL (email_logs, email_bounces tables)
- AWS SES (email delivery)

**Key Endpoints:**
- `POST /api/email/send` - Send custom email
- `POST /api/email/visit-report` - Send visit report
- `POST /api/email/password-reset` - Send password reset
- `POST /api/email/welcome` - Send welcome email
- `GET /api/email/logs` - Get email logs
- `POST /api/email/webhook/ses` - SES bounce/complaint webhook

#### 6. File Upload Service (Embedded in Visit Service)
**Purpose:** Secure file upload and storage

**Responsibilities:**
- Photo upload with validation
- Thumbnail generation
- S3 server-side encryption
- File metadata management
- MIME type validation

**Dependencies:**
- AWS S3 (encrypted file storage)
- PostgreSQL (photos table)
- Sharp (image processing)

**Key Endpoints:**
- `POST /api/uploads/photo` - Upload photo
- `GET /api/uploads/photos/:id` - Get photo metadata

---

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- nurse, coordinator, admin, family
  organization_id UUID REFERENCES organizations(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_auth0_id ON users(auth0_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
```

#### visits
```sql
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  nurse_id UUID NOT NULL REFERENCES users(id),
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  status VARCHAR(50) NOT NULL, -- scheduled, in_progress, completed, cancelled
  check_in_latitude DECIMAL(10, 8),
  check_in_longitude DECIMAL(11, 8),
  check_in_accuracy DECIMAL(10, 2),
  location_verified BOOLEAN DEFAULT false,
  verification_distance DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_visits_client ON visits(client_id);
CREATE INDEX idx_visits_nurse ON visits(nurse_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_scheduled_start ON visits(scheduled_start);
```

#### photos
```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  s3_key VARCHAR(500) NOT NULL,
  s3_bucket VARCHAR(255) NOT NULL,
  thumbnail_s3_key VARCHAR(500),
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  encryption_key_id VARCHAR(255) NOT NULL, -- KMS key ID
  is_encrypted BOOLEAN DEFAULT true,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_photos_visit ON photos(visit_id);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);
```

#### push_notification_tokens
```sql
CREATE TABLE push_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  fcm_token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL, -- ios, android, web
  app_version VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(device_id, user_id)
);

CREATE INDEX idx_tokens_user ON push_notification_tokens(user_id);
CREATE INDEX idx_tokens_active ON push_notification_tokens(is_active);
```

#### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- visit_reminder, team_alert, sync_update, family_update
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  priority VARCHAR(20) DEFAULT 'normal', -- high, normal, low
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, read
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

#### email_logs
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  type VARCHAR(50) NOT NULL, -- visit_report, password_reset, welcome, etc.
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, bounced, complained
  message_id VARCHAR(255),
  error_message TEXT,
  metadata JSONB,
  sent_at TIMESTAMP,
  bounced_at TIMESTAMP,
  complained_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created ON email_logs(created_at DESC);
```

#### sync_state
```sql
CREATE TABLE sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- visits, clients, care_plans, etc.
  entity_id UUID NOT NULL,
  last_synced_at TIMESTAMP NOT NULL,
  version INTEGER DEFAULT 1,
  checksum VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX idx_sync_state_user ON sync_state(user_id);
CREATE INDEX idx_sync_state_entity ON sync_state(entity_type, entity_id);
CREATE INDEX idx_sync_state_synced ON sync_state(last_synced_at);
```

### Database Relationships

```
organizations (1) ──< (N) users
users (1) ──< (N) visits
clients (1) ──< (N) visits
visits (1) ──< (N) photos
visits (1) ──< (N) care_activities
users (1) ──< (N) push_notification_tokens
users (1) ──< (N) notifications
users (1) ──< (N) notification_preferences
users (1) ──< (N) sync_state
```

---

## Authentication & Authorization

### Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Auth0   │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │ 1. Login Request (email/password)              │
     │───────────────────────────────────────────────>│
     │                                                │
     │ 2. Validate Credentials                        │
     │                                                │
     │ 3. Return JWT Tokens                           │
     │<───────────────────────────────────────────────│
     │   (access_token, refresh_token, id_token)      │
     │                                                │
     ▼                                                │
┌──────────────┐                                     │
│ User Service │                                     │
└──────┬───────┘                                     │
       │                                              │
       │ 4. Validate Access Token                    │
       │<─────────────────────────────────────────────
       │                                              │
       │ 5. Extract User Claims                       │
       │    (user_id, role, permissions)              │
       │                                              │
       │ 6. Check RBAC Permissions                    │
       │                                              │
       │ 7. Allow/Deny Request                        │
       │                                              │
```

### Token Structure

**Access Token (JWT):**
```json
{
  "sub": "auth0|123456789",
  "email": "nurse@example.com",
  "role": "nurse",
  "organization_id": "org-uuid",
  "permissions": ["read:own_visits", "write:own_visits"],
  "iat": 1704326400,
  "exp": 1704412800
}
```

**Refresh Token:**
- Opaque token stored in Auth0
- Used to obtain new access tokens
- Expires after 30 days of inactivity

### Role-Based Access Control (RBAC)

#### Roles & Permissions Matrix

| Permission | Nurse | Coordinator | Admin | Family |
|------------|-------|-------------|-------|--------|
| `read:own_visits` | ✅ | ✅ | ✅ | ✅ |
| `write:own_visits` | ✅ | ✅ | ✅ | ❌ |
| `read:all_visits` | ❌ | ✅ | ✅ | ❌ |
| `write:all_visits` | ❌ | ✅ | ✅ | ❌ |
| `read:users` | ❌ | ✅ | ✅ | ❌ |
| `write:users` | ❌ | ❌ | ✅ | ❌ |
| `manage:organization` | ❌ | ❌ | ✅ | ❌ |
| `read:reports` | ❌ | ✅ | ✅ | ✅ |

#### Middleware Chain

```typescript
// Example: Protected endpoint with RBAC
router.get('/api/visits',
  authenticate,                    // Validate JWT
  requirePermission('read:all_visits'),  // Check permission
  visitController.getVisits        // Handle request
);
```

---

## API Reference

### Common Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "errors": [ /* validation errors */ ]
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Rate Limiting

**Authentication Endpoints:**
- 10 requests per minute per IP
- Applies to `/auth/login` and `/auth/refresh`

**API Endpoints:**
- 100 requests per minute per user
- Configurable per endpoint

---

## Data Flow Diagrams

### Visit Check-In Flow

```
┌────────┐                                              ┌──────────────┐
│ Mobile │                                              │Visit Service │
│  App   │                                              └──────┬───────┘
└───┬────┘                                                     │
    │                                                          │
    │ 1. POST /api/visits/:id/check-in                        │
    │    { latitude, longitude, accuracy, timestamp }         │
    │─────────────────────────────────────────────────────────>│
    │                                                          │
    │                                                          │ 2. Validate JWT
    │                                                          │
    │                                                          │ 3. Get client address
    │                                                          │
    │                                                          ▼
    │                                              ┌────────────────────┐
    │                                              │ Google Maps API    │
    │                                              └────────┬───────────┘
    │                                                       │
    │                                                       │ 4. Geocode address
    │                                                       │
    │                                                       │ 5. Calculate distance
    │                                                       │
    │                                              ┌────────▼───────────┐
    │                                              │ Location Service   │
    │                                              └────────┬───────────┘
    │                                                       │
    │                                                       │ 6. Verify location
    │                                                       │    (100m urban / 500m rural)
    │                                                       │
    │                                              ┌────────▼───────────┐
    │                                              │   PostgreSQL       │
    │                                              └────────┬───────────┘
    │                                                       │
    │                                                       │ 7. Update visit
    │                                                       │    - actual_start
    │                                                       │    - location_verified
    │                                                       │    - status = 'in_progress'
    │                                                       │
    │ 8. Response                                          │
    │<─────────────────────────────────────────────────────┤
    │    { visit_id, checked_in_at, location_verified }    │
    │                                                       │
```

### Sync Flow (Pull)

```
┌────────┐                                    ┌─────────────┐
│ Mobile │                                    │Sync Service │
│  App   │                                    └──────┬──────┘
└───┬────┘                                           │
    │                                                │
    │ 1. POST /api/sync/pull                        │
    │    { last_sync_timestamp, entity_types }      │
    │───────────────────────────────────────────────>│
    │                                                │
    │                                                │ 2. Query changes
    │                                                │    WHERE updated_at > last_sync
    │                                                │
    │                                                ▼
    │                                    ┌────────────────────┐
    │                                    │    PostgreSQL      │
    │                                    └────────┬───────────┘
    │                                             │
    │                                             │ 3. Return changed entities
    │                                             │
    │ 4. Response                                 │
    │<────────────────────────────────────────────┤
    │    {                                        │
    │      changes: [                             │
    │        { entity_type, entity_id, data }     │
    │      ],                                     │
    │      sync_timestamp                         │
    │    }                                        │
    │                                             │
```

---

## Security Architecture

### Encryption

**Data at Rest:**
- Database: PostgreSQL with encryption at rest (AWS RDS encryption)
- Files: S3 server-side encryption (SSE-KMS)
- Sensitive fields: Application-level encryption using AES-256-GCM

**Data in Transit:**
- TLS 1.3 for all HTTP connections
- WSS (WebSocket Secure) for real-time connections

### Input Validation

**Layers:**
1. **Schema Validation:** express-validator middleware
2. **Type Validation:** TypeScript compile-time checks
3. **Business Rules:** Service-layer validation
4. **Database Constraints:** Foreign keys, unique constraints, check constraints

### Security Headers

```typescript
// Configured via helmet.js
{
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true
}
```

---

## Infrastructure

### Environment Variables

**Required:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_NAME=berthcare
DB_USER=postgres
DB_PASSWORD=secure_password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.berthcare.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=berthcare-uploads
S3_KMS_KEY_ID=your_kms_key_id

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# SES
SES_SENDER_EMAIL=noreply@berthcare.com
SES_SENDER_NAME=BerthCare

# Google Maps
GOOGLE_MAPS_API_KEY=your_api_key

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
ALLOWED_ORIGINS=https://app.berthcare.com
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h
```

### Health Checks

**Endpoints:**
- `GET /health` - Overall service health
- `GET /health/db` - Database connectivity
- `GET /health/redis` - Redis connectivity

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-03T10:00:00Z",
  "service": "user-service",
  "version": "1.0.0",
  "uptime": 86400
}
```

---

## Deployment

### Service Ports

| Service | Port | Protocol |
|---------|------|----------|
| User Service | 3001 | HTTP |
| Visit Service | 3002 | HTTP |
| Sync Service | 3003 | HTTP/WS |
| Notification Service | 3004 | HTTP |

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis connection verified
- [ ] AWS credentials configured
- [ ] Auth0 tenant configured
- [ ] Firebase project configured
- [ ] Health checks passing
- [ ] Logs aggregation configured
- [ ] Monitoring alerts configured
- [ ] Backup strategy implemented

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-03 | 1.0.0 | Initial architecture documentation | Backend Team |

---

**Document Maintainers:** Backend Development Team  
**Review Frequency:** After each major feature release  
**Next Review:** After Phase 5 completion


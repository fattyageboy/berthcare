# BerthCare System Architecture

**Version:** 2.0.0  
**Last Updated:** October 7, 2025  
**Status:** Staging Infrastructure Deployed

## Philosophy

> "Simplicity is the ultimate sophistication. Start with the user experience, then work backwards to the technology."

BerthCare's architecture is designed to be **invisible**. Every technical decision traces back to a single question: **Does this help a nurse provide better care?**

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Technology Stack](#technology-stack)
4. [Infrastructure Architecture](#infrastructure-architecture)
5. [Local Development Environment](#local-development-environment)
6. [Communication Services](#communication-services)
7. [Data Architecture](#data-architecture)
8. [Security & Compliance](#security--compliance)
9. [Monitoring & Observability](#monitoring--observability)
10. [Deployment Architecture](#deployment-architecture)
11. [Resource Inventory](#resource-inventory)

## System Overview

BerthCare is a mobile-first home care documentation platform with an offline-first architecture. The system consists of:

- **Mobile Application:** React Native app for nurses and care aides
- **Backend API:** Node.js/Express REST API
- **Family Portal:** Web-based read-only portal for families
- **Communication Services:** Twilio-powered voice and SMS
- **Cloud Infrastructure:** AWS ca-central-1 (Canadian data residency)

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Mobile App      │  │  Family Portal   │  │  Admin Dashboard │  │
│  │  (React Native)  │  │  (Web)           │  │  (Web)           │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         API Gateway Layer                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  CloudFront CDN (Edge Caching, SSL Termination)             │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Application Layer                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Backend API (Node.js/Express)                               │   │
│  │  - REST endpoints                                            │   │
│  │  - Socket.io for real-time                                   │   │
│  │  - Authentication & authorization                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  PostgreSQL  │  │  Redis       │  │  S3 Storage  │              │
│  │  (RDS)       │  │  (ElastiCache)│  │  (Photos)    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘

                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    External Services Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Twilio      │  │  Sentry      │  │  CloudWatch  │              │
│  │  (Voice/SMS) │  │  (Errors)    │  │  (Monitoring)│              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

## Architecture Principles

### 1. Offline-First
**Principle:** The app must work without internet connectivity.

**Implementation:**
- Mobile app uses local SQLite database (WatermelonDB)
- All data operations work offline
- Background sync when connectivity restored
- Conflict resolution with last-write-wins strategy

### 2. Canadian Data Residency
**Principle:** All data must remain in Canada for PIPEDA compliance.

**Implementation:**
- All AWS resources in ca-central-1 (Canada Central)
- No cross-region replication
- Twilio phone numbers are Canadian (+1)
- CloudFront edge locations include Canada

### 3. Security by Default
**Principle:** Security is not optional, it's the foundation.

**Implementation:**
- Encryption at rest (RDS, Redis, S3)
- Encryption in transit (TLS 1.2+)
- Secrets stored in AWS Secrets Manager
- IAM roles with least privilege
- Multi-factor authentication for admin access

### 4. Scalability Through Simplicity
**Principle:** Scale by doing less, not more.

**Implementation:**
- Stateless API design
- Redis caching for frequently accessed data
- CloudFront CDN for static assets
- Auto-scaling based on demand
- Efficient database queries with proper indexing

### 5. Observable Systems
**Principle:** You can't fix what you can't see.

**Implementation:**
- Structured logging to CloudWatch
- Sentry for error tracking
- CloudWatch dashboards for metrics
- Automated alerts for critical issues
- Request tracing with correlation IDs

## Technology Stack

### Mobile Application
- **Framework:** React Native 0.73+ with Expo SDK 50+
- **Local Database:** WatermelonDB (SQLite wrapper)
- **State Management:** Zustand + React Query
- **Offline Sync:** Custom sync engine with conflict resolution
- **Push Notifications:** Expo Push Notifications

### Backend Services
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 4.x
- **API Style:** REST (simple, cacheable, well-understood)
- **Real-time:** Socket.io for care coordination alerts
- **Authentication:** JWT with refresh tokens

### Data Layer
- **Server Database:** PostgreSQL 15+ (RDS Multi-AZ)
- **Mobile Database:** SQLite via WatermelonDB
- **Caching:** Redis 7+ (ElastiCache with replication)
- **File Storage:** AWS S3 (photos, signatures, documents)
- **CDN:** CloudFront for asset delivery

### Communication
- **Voice Calls:** Twilio Voice API
- **SMS:** Twilio SMS API
- **Push Notifications:** Expo Push Notifications
- **In-App Messaging:** Socket.io

### Infrastructure
- **Cloud Provider:** AWS (ca-central-1)
- **Infrastructure as Code:** Terraform 1.5+
- **Container Orchestration:** Docker Compose (local), ECS Fargate (production)
- **Monitoring:** CloudWatch + Sentry
- **CI/CD:** GitHub Actions

## Infrastructure Architecture

### AWS Region: ca-central-1 (Canada Central)

All infrastructure is deployed in the Canada Central region for PIPEDA compliance and data residency requirements.

### Network Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  VPC: 10.0.0.0/16                                                    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Public Subnets (2 AZs)                                      │    │
│  │  - 10.0.1.0/24 (ca-central-1a)                               │    │
│  │  - 10.0.2.0/24 (ca-central-1b)                               │    │
│  │  ┌──────────────┐  ┌──────────────┐                         │    │
│  │  │  NAT Gateway │  │  NAT Gateway │                         │    │
│  │  └──────────────┘  └──────────────┘                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Private Subnets (2 AZs)                                     │    │
│  │  - 10.0.11.0/24 (ca-central-1a)                              │    │
│  │  - 10.0.12.0/24 (ca-central-1b)                              │    │
│  │  ┌──────────────────────────────────────────────────────┐   │    │
│  │  │  Backend API (ECS Fargate)                           │   │    │
│  │  └──────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Database Subnets (2 AZs)                                    │    │
│  │  - 10.0.21.0/24 (ca-central-1a)                              │    │
│  │  - 10.0.22.0/24 (ca-central-1b)                              │    │
│  │  ┌──────────────┐  ┌──────────────┐                         │    │
│  │  │  RDS Primary │  │  RDS Standby │                         │    │
│  │  └──────────────┘  └──────────────┘                         │    │
│  │  ┌──────────────┐  ┌──────────────┐                         │    │
│  │  │  Redis       │  │  Redis       │                         │    │
│  │  │  Primary     │  │  Replica     │                         │    │
│  │  └──────────────┘  └──────────────┘                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Terraform Module Structure

```
terraform/
├── environments/
│   └── staging/
│       ├── main.tf                    # Environment orchestration
│       ├── variables.tf               # Environment variables
│       ├── outputs.tf                 # Resource outputs
│       └── terraform.tfvars.example   # Configuration template
└── modules/
    ├── networking/                    # VPC, subnets, security groups
    ├── database/                      # RDS PostgreSQL
    ├── cache/                         # ElastiCache Redis
    ├── storage/                       # S3 buckets
    ├── cdn/                           # CloudFront distribution
    ├── iam/                           # IAM roles and policies
    ├── monitoring/                    # CloudWatch dashboards & alarms
    └── secrets/                       # Secrets Manager (Twilio)
```


## Local Development Environment

### Philosophy
> "If users need a manual, the design has failed" - Local setup should just work.

### Quick Start

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Start all services
docker-compose up --build

# 3. Verify everything is running
docker-compose ps
```

### Services

#### 1. PostgreSQL 15
**Purpose:** Server-side database (source of truth)

**Configuration:**
- **Port:** 5432
- **Database:** berthcare_dev
- **User:** berthcare
- **Password:** berthcare_local_dev_password
- **Connection:** `postgresql://berthcare:berthcare_local_dev_password@localhost:5432/berthcare_dev`

**Features:**
- ACID compliance for data integrity
- Relational integrity with foreign keys
- Complex queries with joins
- Full-text search capabilities
- JSON/JSONB support for flexible data

**Health Check:** `pg_isready -U berthcare -d berthcare_dev`

#### 2. Redis 7
**Purpose:** Performance layer (caching, sessions, rate limiting)

**Configuration:**
- **Port:** 6379
- **Password:** berthcare_redis_password
- **Connection:** `redis://:berthcare_redis_password@localhost:6379/0`

**Use Cases:**
- Session management (JWT refresh tokens)
- API response caching
- Rate limiting (prevent abuse)
- Presence tracking (online users)
- Real-time pub/sub for Socket.io

**Features:**
- Persistence with AOF (Append-Only File)
- Automatic failover in production
- Sub-millisecond latency

**Health Check:** `redis-cli -a berthcare_redis_password PING`

#### 3. LocalStack (AWS S3 Emulation)
**Purpose:** Local S3 for photo/document storage

**Configuration:**
- **Port:** 4566
- **Bucket:** berthcare-dev
- **Endpoint:** `http://localhost:4566`
- **Region:** ca-central-1

**Features:**
- Full S3 API compatibility
- No AWS costs during development
- Fast local file operations
- Automatic bucket creation

**Health Check:** `curl http://localhost:4566/_localstack/health`

### Optional Development Tools

Start with `docker-compose --profile tools up`:

#### 4. pgAdmin
**Purpose:** PostgreSQL web interface

- **URL:** http://localhost:5050
- **Email:** dev@berthcare.local
- **Password:** admin

#### 5. Redis Commander
**Purpose:** Redis web interface

- **URL:** http://localhost:8081

### Data Persistence

All data is persisted in Docker volumes:
- `postgres_data` - PostgreSQL database files
- `redis_data` - Redis persistence files
- `localstack_data` - LocalStack S3 files

**Clean slate reset:**
```bash
docker-compose down -v
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  Developer Machine                                                   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Backend API (Node.js)                                        │   │
│  │  Port: 3000                                                   │   │
│  │  - REST endpoints                                             │   │
│  │  - Socket.io server                                           │   │
│  │  - JWT authentication                                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                          ↓           ↓           ↓                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  PostgreSQL  │  │  Redis       │  │  LocalStack  │              │
│  │  :5432       │  │  :6379       │  │  S3 :4566    │              │
│  │  (Docker)    │  │  (Docker)    │  │  (Docker)    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Mobile App (Expo)                                            │   │
│  │  - React Native                                               │   │
│  │  - WatermelonDB (SQLite)                                      │   │
│  │  - Offline-first sync                                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Communication Services

### Twilio Configuration

BerthCare uses Twilio for voice calls and SMS messaging to families and care coordinators.

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Twilio Console                                                      │
│  - Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                   │
│  - Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                      │
│  - Phone Numbers: +1XXXXXXXXXX (Voice), +1XXXXXXXXXX (SMS)          │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  AWS Secrets Manager (ca-central-1)                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  staging/twilio/account                                       │   │
│  │  - account_sid                                                │   │
│  │  - auth_token                                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  staging/twilio/phone-numbers                                 │   │
│  │  - voice_number                                               │   │
│  │  - sms_number                                                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  staging/twilio/webhooks                                      │   │
│  │  - voice_webhook_url                                          │   │
│  │  - voice_status_callback_url                                  │   │
│  │  - sms_webhook_url                                            │   │
│  │  - sms_status_callback_url                                    │   │
│  │  - webhook_auth_token                                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Backend API                                                         │
│  - Retrieves credentials from Secrets Manager                       │
│  - Makes Twilio API calls                                           │
│  - Handles webhook callbacks                                        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Secrets Management

**Terraform Module:** `terraform/modules/secrets/`

**Secrets Created:**
1. `{environment}/twilio/account` - Account SID and Auth Token
2. `{environment}/twilio/phone-numbers` - Voice and SMS numbers
3. `{environment}/twilio/webhooks` - Webhook URLs and auth token

**IAM Policy:**
- Backend service has read-only access to Twilio secrets
- KMS decryption permissions scoped to Secrets Manager
- CloudWatch alarms for unauthorized access attempts

**Security Features:**
- Encryption at rest with AWS KMS
- Encryption in transit with TLS 1.2+
- CloudTrail logging of all secret access
- 90-day rotation schedule recommended

#### Webhook Flow

```
Twilio Event (Call/SMS)
    ↓
Webhook URL (Backend API)
    ↓
Signature Validation (Twilio signature)
    ↓
Auth Token Validation (Custom token)
    ↓
Event Processing
    ↓
Status Callback
    ↓
Twilio Console Logs
```

#### Configuration

**Webhook URLs (Staging):**
- Voice Webhook: `https://api-staging.berthcare.ca/v1/voice/webhook`
- Voice Status: `https://api-staging.berthcare.ca/v1/voice/status`
- SMS Webhook: `https://api-staging.berthcare.ca/v1/sms/webhook`
- SMS Status: `https://api-staging.berthcare.ca/v1/sms/status`

**Phone Numbers:**
- Format: E.164 (+1XXXXXXXXXX)
- Country: Canada (+1)
- Capabilities: Voice and SMS

**Setup Script:**
```bash
./scripts/setup-twilio.sh staging
```

For detailed Twilio setup instructions, see:
- [Twilio Setup Guide](./twilio-setup.md)
- [Twilio Configuration Checklist](./E7-twilio-configuration-checklist.md)
- [Twilio Quick Reference](./twilio-quick-reference.md)


## Data Architecture

### Database Schema Philosophy

> "Question everything about the current design" - Every table, every column must justify its existence.

### PostgreSQL (Server Database)

**Purpose:** Server-side source of truth for all data

**Key Design Decisions:**

1. **Normalized Schema:** Third normal form (3NF) for data integrity
2. **Soft Deletes:** `deleted_at` timestamp instead of hard deletes
3. **Audit Trails:** `created_at`, `updated_at`, `created_by`, `updated_by` on all tables
4. **UUID Primary Keys:** For distributed systems and security
5. **JSONB Columns:** For flexible metadata without schema changes

**Core Tables:**

```sql
-- Users (nurses, care aides, coordinators)
users
  - id (UUID, PK)
  - email (VARCHAR, UNIQUE)
  - role (ENUM: nurse, care_aide, coordinator, admin)
  - created_at, updated_at, deleted_at

-- Clients (patients receiving care)
clients
  - id (UUID, PK)
  - first_name, last_name
  - date_of_birth
  - address (JSONB)
  - emergency_contacts (JSONB)
  - care_plan (JSONB)
  - created_at, updated_at, deleted_at

-- Visits (care visits)
visits
  - id (UUID, PK)
  - client_id (UUID, FK)
  - user_id (UUID, FK)
  - scheduled_start, scheduled_end
  - actual_start, actual_end
  - location (POINT) -- GPS coordinates
  - status (ENUM: scheduled, in_progress, completed, cancelled)
  - notes (TEXT)
  - created_at, updated_at, deleted_at

-- Visit Tasks (tasks completed during visit)
visit_tasks
  - id (UUID, PK)
  - visit_id (UUID, FK)
  - task_type (ENUM: vitals, medication, personal_care, etc.)
  - completed (BOOLEAN)
  - data (JSONB) -- flexible task-specific data
  - created_at, updated_at

-- Sync Log (for offline sync)
sync_log
  - id (UUID, PK)
  - user_id (UUID, FK)
  - device_id (VARCHAR)
  - table_name (VARCHAR)
  - record_id (UUID)
  - operation (ENUM: create, update, delete)
  - data (JSONB)
  - synced_at (TIMESTAMP)
```

**Indexes:**
- Primary keys (automatic)
- Foreign keys (for joins)
- `users.email` (for login)
- `visits.client_id, visits.scheduled_start` (for schedule queries)
- `sync_log.user_id, sync_log.synced_at` (for sync queries)

**Performance Optimizations:**
- Connection pooling (max 100 connections)
- Query result caching in Redis
- Prepared statements for common queries
- EXPLAIN ANALYZE for slow queries

### SQLite (Mobile Database)

**Purpose:** Offline-first local database on mobile devices

**Key Design Decisions:**

1. **Mirror Server Schema:** Same tables and columns as PostgreSQL
2. **WatermelonDB:** Reactive database with lazy loading
3. **Sync Metadata:** `_status` and `_changed` columns for sync tracking
4. **Lightweight:** Only data relevant to the user

**Sync Strategy:**

```
Mobile Device                    Server
    ↓                              ↓
Local SQLite                   PostgreSQL
    ↓                              ↓
Detect Changes                 Detect Changes
    ↓                              ↓
Push Changes    ──────────→    Validate & Save
    ↓                              ↓
Pull Changes    ←──────────    Send Updates
    ↓                              ↓
Resolve Conflicts              Resolve Conflicts
    ↓                              ↓
Update Local DB                Update Server DB
```

**Conflict Resolution:**
- Last-write-wins (LWW) strategy
- Server timestamp is authoritative
- User notified of conflicts
- Manual resolution for critical data

### Redis (Cache Layer)

**Purpose:** High-performance caching and session management

**Key-Value Patterns:**

```
# Session Management
session:{user_id}:{session_id} → JWT refresh token
TTL: 7 days

# API Response Caching
api:clients:list:{user_id} → JSON array of clients
TTL: 5 minutes

# Rate Limiting
ratelimit:{ip}:{endpoint} → request count
TTL: 1 minute

# Presence Tracking
presence:{user_id} → last_seen timestamp
TTL: 5 minutes

# Real-time Pub/Sub
channel:alerts → care coordination alerts
channel:sync → sync notifications
```

**Cache Invalidation:**
- Time-based expiration (TTL)
- Event-based invalidation (on data changes)
- Manual invalidation (admin tools)

### S3 (File Storage)

**Purpose:** Photo, signature, and document storage

**Bucket Structure:**

```
berthcare-photos-staging-ca-central-1/
  ├── clients/
  │   └── {client_id}/
  │       ├── profile.jpg
  │       └── photos/
  │           └── {photo_id}.jpg
  ├── visits/
  │   └── {visit_id}/
  │       ├── signature.png
  │       └── photos/
  │           └── {photo_id}.jpg
  └── users/
      └── {user_id}/
          └── profile.jpg

berthcare-documents-staging-ca-central-1/
  ├── care-plans/
  │   └── {client_id}/
  │       └── {document_id}.pdf
  └── reports/
      └── {report_id}.pdf
```

**Lifecycle Policies:**
- Standard storage: 0-365 days
- Glacier storage: 365+ days (7-year retention for compliance)
- Versioning enabled for audit trail

**Access Control:**
- Pre-signed URLs for temporary access (15 minutes)
- CloudFront for public assets (photos)
- IAM roles for backend access
- No public bucket access

## Security & Compliance

### PIPEDA Compliance

**Personal Information Protection and Electronic Documents Act (Canada)**

#### Data Residency
- ✅ All data stored in ca-central-1 (Canada Central)
- ✅ No cross-region replication
- ✅ CloudFront edge locations include Canada
- ✅ Twilio phone numbers are Canadian

#### Encryption
- ✅ At rest: RDS (AES-256), Redis (AES-256), S3 (AES-256)
- ✅ In transit: TLS 1.2+ for all connections
- ✅ Mobile: SQLite database encrypted with SQLCipher

#### Access Controls
- ✅ IAM roles with least privilege
- ✅ Multi-factor authentication for admin access
- ✅ Role-based access control (RBAC) in application
- ✅ Security groups restrict network access

#### Audit Trails
- ✅ CloudTrail logs all AWS API calls
- ✅ CloudWatch logs all application events
- ✅ Database audit logs for data access
- ✅ `created_by`, `updated_by` columns on all tables

#### Data Retention
- ✅ 7-year retention for care records (S3 Glacier)
- ✅ 90-day retention for error logs
- ✅ 30-day retention for application logs
- ✅ Soft deletes with `deleted_at` timestamp

#### User Rights
- ✅ Data export API (JSON format)
- ✅ Data deletion API (soft delete)
- ✅ Consent management (opt-in/opt-out)
- ✅ Privacy policy and terms of service

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Perimeter Security                                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  CloudFront (WAF, DDoS Protection, SSL Termination)          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Application Security                                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Backend API                                                  │   │
│  │  - JWT authentication                                         │   │
│  │  - Role-based access control (RBAC)                          │   │
│  │  - Input validation & sanitization                           │   │
│  │  - Rate limiting (Redis)                                     │   │
│  │  - CORS configuration                                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Network Security                                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  VPC Security Groups                                          │   │
│  │  - Backend: Allow 443 from CloudFront only                   │   │
│  │  - Database: Allow 5432 from backend only                    │   │
│  │  - Redis: Allow 6379 from backend only                       │   │
│  │  - S3: IAM role-based access only                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Data Security                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Encryption at Rest                                           │   │
│  │  - RDS: AES-256 with AWS KMS                                 │   │
│  │  - Redis: AES-256 with AWS KMS                               │   │
│  │  - S3: AES-256 (SSE-S3)                                      │   │
│  │  - Secrets Manager: AES-256 with AWS KMS                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Encryption in Transit                                        │   │
│  │  - TLS 1.2+ for all connections                              │   │
│  │  - Certificate pinning in mobile app                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Authentication & Authorization

**JWT Token Flow:**

```
1. User Login
   ↓
2. Backend validates credentials
   ↓
3. Generate access token (15 min) + refresh token (7 days)
   ↓
4. Store refresh token in Redis
   ↓
5. Return tokens to client
   ↓
6. Client stores tokens securely (Keychain/Keystore)
   ↓
7. Client includes access token in API requests
   ↓
8. Backend validates token signature and expiration
   ↓
9. When access token expires, use refresh token to get new one
   ↓
10. Repeat until refresh token expires (re-login required)
```

**Role-Based Access Control (RBAC):**

```
Roles:
- admin: Full system access
- coordinator: Manage clients, users, schedules
- nurse: Document visits, view care plans
- care_aide: Document basic tasks, view schedules
- family: Read-only access to specific client

Permissions:
- clients.read, clients.write, clients.delete
- visits.read, visits.write, visits.delete
- users.read, users.write, users.delete
- reports.read, reports.write
```


## Monitoring & Observability

### Philosophy
> "Obsess over every detail" - Monitor everything that matters.

### CloudWatch Dashboards

#### 1. API Performance Dashboard
**Name:** `berthcare-staging-api-performance`

**Metrics:**
- API Latency (Average and P99)
- Request Count by Status Code (2xx, 4xx, 5xx)
- Connection Errors
- Unhealthy Hosts
- Sync Performance (batch size, duration)

**Access:** AWS Console → CloudWatch → Dashboards → berthcare-staging-api-performance

#### 2. Database Performance Dashboard
**Name:** `berthcare-staging-database`

**Metrics:**
- CPU Utilization
- Active Connections
- Read/Write Latency
- Free Memory and Storage
- Replication Lag (Multi-AZ)

**Access:** AWS Console → CloudWatch → Dashboards → berthcare-staging-database

#### 3. Error Tracking Dashboard
**Name:** `berthcare-staging-errors`

**Widgets:**
- Recent Errors (Last 100 from logs)
- Error Rate Trend
- Error Distribution by Type
- Top Error Messages

**Access:** AWS Console → CloudWatch → Dashboards → berthcare-staging-errors

### CloudWatch Alarms

#### Critical Alarms (Immediate Action Required)

1. **Unhealthy Hosts**
   - Threshold: > 0 unhealthy hosts
   - Evaluation: 1 period of 1 minute
   - Action: SNS notification
   - Severity: Critical

2. **Database CPU High**
   - Threshold: > 80% CPU utilization
   - Evaluation: 2 consecutive periods of 5 minutes
   - Action: SNS notification
   - Severity: Critical

#### High Priority Alarms

3. **API Error Rate High**
   - Threshold: > 5% error rate
   - Evaluation: 2 consecutive periods of 5 minutes
   - Action: SNS notification
   - Severity: High

4. **Database Connections High**
   - Threshold: > 80 connections (80% of max 100)
   - Evaluation: 2 consecutive periods of 5 minutes
   - Action: SNS notification
   - Severity: High

#### Medium Priority Alarms

5. **API Latency High**
   - Threshold: > 1 second average latency
   - Evaluation: 3 consecutive periods of 5 minutes
   - Action: SNS notification
   - Severity: Medium

6. **Unauthorized Secret Access**
   - Threshold: > 0 unauthorized access attempts
   - Evaluation: 1 period of 1 minute
   - Action: SNS notification
   - Severity: Medium

### Sentry Error Tracking

**Projects:**
- `berthcare-backend` - Backend API errors
- `berthcare-mobile` - Mobile app errors

**Features:**
- Error tracking with stack traces
- Performance monitoring (10% sample rate)
- Profiling (10% sample rate)
- Breadcrumbs for debugging
- User context (user ID, role)
- Sensitive data filtering

**Integration:**
```javascript
// Backend
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
});

// Mobile
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
});
```

### CloudWatch Logs

**Log Groups:**

1. `/berthcare/staging/backend/api`
   - All API requests and responses
   - Retention: 30 days

2. `/berthcare/staging/backend/errors`
   - All errors and exceptions
   - Retention: 90 days (compliance)

3. `/berthcare/staging/database`
   - Database queries and performance
   - Retention: 30 days

**Log Format (Structured JSON):**
```json
{
  "timestamp": "2025-10-07T12:34:56.789Z",
  "level": "INFO",
  "service": "berthcare-api",
  "environment": "staging",
  "message": "API Request: GET /api/v1/clients",
  "requestId": "uuid-here",
  "userId": "user-123",
  "method": "GET",
  "path": "/api/v1/clients",
  "statusCode": 200,
  "duration": 45
}
```

**CloudWatch Insights Queries:**

```sql
-- Find all errors in last hour
fields @timestamp, level, message, error, stack
| filter level = "ERROR"
| sort @timestamp desc
| limit 100

-- Find slow API requests (>1s)
fields @timestamp, method, path, duration
| filter duration > 1000
| sort duration desc
| limit 50

-- Find requests by user
fields @timestamp, method, path, statusCode
| filter userId = "user-123"
| sort @timestamp desc
```

### Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Application Layer                                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Backend API                                                  │   │
│  │  - Monitoring middleware                                      │   │
│  │  - Request ID tracking                                        │   │
│  │  - Performance timing                                         │   │
│  │  - Error capturing                                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                          ↓           ↓           ↓
              ┌───────────┴───────────┴───────────┴──────────┐
              ↓                       ↓                       ↓
    ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐
    │  CloudWatch     │   │  Sentry         │   │  CloudWatch      │
    │  Metrics        │   │  Error Tracking │   │  Logs            │
    └─────────────────┘   └─────────────────┘   └──────────────────┘
              ↓                                           ↓
    ┌─────────────────┐                       ┌──────────────────┐
    │  CloudWatch     │                       │  CloudWatch      │
    │  Dashboards     │                       │  Alarms          │
    └─────────────────┘                       └──────────────────┘
                                                      ↓
                                              ┌──────────────────┐
                                              │  SNS Topic       │
                                              │  - Email alerts  │
                                              └──────────────────┘
```

For detailed monitoring setup, see:
- [Monitoring Setup Guide](./monitoring-setup.md)
- [Monitoring Quick Reference](./monitoring-quick-reference.md)

## Deployment Architecture

### Staging Environment

**Purpose:** Pre-production testing and validation

**Configuration:**
- **Environment:** staging
- **Region:** ca-central-1
- **VPC CIDR:** 10.0.0.0/16
- **Availability Zones:** 2 (ca-central-1a, ca-central-1b)

**Compute:**
- **Backend:** ECS Fargate (future) or EC2 t3.medium
- **Auto-scaling:** Min 1, Max 3 instances
- **Load Balancer:** Application Load Balancer (ALB)

**Database:**
- **Instance:** db.t4g.medium (2 vCPU, 4 GB RAM)
- **Storage:** 100 GB gp3 (auto-scaling to 500 GB)
- **Multi-AZ:** Yes (high availability)
- **Backup:** 7-day retention

**Cache:**
- **Instance:** cache.t4g.micro (2 nodes)
- **Replication:** Primary + Replica
- **Automatic Failover:** Enabled

**Storage:**
- **Photos Bucket:** berthcare-photos-staging-ca-central-1
- **Documents Bucket:** berthcare-documents-staging-ca-central-1
- **Versioning:** Enabled
- **Lifecycle:** Glacier after 365 days

**CDN:**
- **Distribution:** CloudFront
- **Price Class:** PriceClass_100 (North America + Europe)
- **Compression:** Enabled

**Cost:** ~$200-250/month

### Production Environment (Future)

**Purpose:** Live production workload

**Configuration:**
- **Environment:** production
- **Region:** ca-central-1
- **VPC CIDR:** 10.1.0.0/16
- **Availability Zones:** 3 (ca-central-1a, ca-central-1b, ca-central-1d)

**Compute:**
- **Backend:** ECS Fargate
- **Auto-scaling:** Min 2, Max 10 instances
- **Load Balancer:** Application Load Balancer (ALB)

**Database:**
- **Instance:** db.r6g.large (2 vCPU, 16 GB RAM)
- **Storage:** 500 GB gp3 (auto-scaling to 2 TB)
- **Multi-AZ:** Yes
- **Backup:** 30-day retention
- **Read Replicas:** 1 (for reporting)

**Cache:**
- **Instance:** cache.r6g.large (3 nodes)
- **Cluster Mode:** Enabled (sharding)
- **Automatic Failover:** Enabled

**Storage:**
- **Photos Bucket:** berthcare-photos-production-ca-central-1
- **Documents Bucket:** berthcare-documents-production-ca-central-1
- **Versioning:** Enabled
- **Lifecycle:** Glacier after 365 days
- **Cross-Region Replication:** Enabled (disaster recovery)

**CDN:**
- **Distribution:** CloudFront
- **Price Class:** PriceClass_All (global)
- **Compression:** Enabled
- **Custom Domain:** cdn.berthcare.ca

**Cost:** ~$500-800/month (estimated)

### CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│  GitHub Repository                                                   │
│  - main branch (protected)                                           │
│  - feature branches                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  GitHub Actions                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Pull Request Checks                                          │   │
│  │  - Lint (ESLint)                                              │   │
│  │  - Type check (TypeScript)                                    │   │
│  │  - Unit tests (Jest)                                          │   │
│  │  - Integration tests                                          │   │
│  │  - Security scan (npm audit)                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Merge to Main                                                │   │
│  │  - Build Docker image                                         │   │
│  │  - Push to ECR                                                │   │
│  │  - Deploy to staging                                          │   │
│  │  - Run smoke tests                                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Tagged Release                                               │   │
│  │  - Deploy to production                                       │   │
│  │  - Run smoke tests                                            │   │
│  │  - Notify team                                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

For detailed CI/CD setup, see:
- [CI/CD Setup Guide](./ci-setup.md)
- [GitHub Branch Protection Setup](./github-branch-protection-setup.md)


## Resource Inventory

### AWS Resources (Staging Environment)

#### Networking

| Resource Type | Resource Name/ID | Description |
|--------------|------------------|-------------|
| VPC | `berthcare-staging-vpc` | 10.0.0.0/16 |
| Internet Gateway | `berthcare-staging-igw` | Public internet access |
| NAT Gateway | `berthcare-staging-nat-1a` | ca-central-1a |
| NAT Gateway | `berthcare-staging-nat-1b` | ca-central-1b |
| Public Subnet | `berthcare-staging-public-1a` | 10.0.1.0/24 |
| Public Subnet | `berthcare-staging-public-1b` | 10.0.2.0/24 |
| Private Subnet | `berthcare-staging-private-1a` | 10.0.11.0/24 |
| Private Subnet | `berthcare-staging-private-1b` | 10.0.12.0/24 |
| Database Subnet | `berthcare-staging-db-1a` | 10.0.21.0/24 |
| Database Subnet | `berthcare-staging-db-1b` | 10.0.22.0/24 |
| Security Group | `berthcare-staging-backend-sg` | Backend API access |
| Security Group | `berthcare-staging-rds-sg` | Database access |
| Security Group | `berthcare-staging-redis-sg` | Cache access |

#### Database

| Resource Type | Resource Name/ID | Configuration |
|--------------|------------------|---------------|
| RDS Instance | `berthcare-staging-db` | PostgreSQL 15.5 |
| Instance Class | db.t4g.medium | 2 vCPU, 4 GB RAM |
| Storage | 100 GB gp3 | Auto-scaling to 500 GB |
| Multi-AZ | Enabled | ca-central-1a, ca-central-1b |
| Backup | 7-day retention | Automated daily backups |
| Encryption | AES-256 | AWS KMS |
| DB Subnet Group | `berthcare-staging-db-subnet-group` | 2 subnets |
| Parameter Group | `berthcare-staging-pg15` | Custom parameters |

**Connection Details:**
- **Endpoint:** `berthcare-staging-db.xxxxxxxxxx.ca-central-1.rds.amazonaws.com`
- **Port:** 5432
- **Database:** berthcare_staging
- **Username:** berthcare_admin
- **Password:** Stored in AWS Secrets Manager (`staging-db-master-password`)

#### Cache

| Resource Type | Resource Name/ID | Configuration |
|--------------|------------------|---------------|
| ElastiCache Cluster | `berthcare-staging-redis` | Redis 7.1 |
| Node Type | cache.t4g.micro | 2 nodes |
| Replication | Primary + Replica | Automatic failover |
| Encryption | AES-256 | At rest and in transit |
| Subnet Group | `berthcare-staging-redis-subnet-group` | 2 subnets |
| Parameter Group | `berthcare-staging-redis7` | Custom parameters |

**Connection Details:**
- **Primary Endpoint:** `berthcare-staging-redis.xxxxxx.ng.0001.cac1.cache.amazonaws.com`
- **Port:** 6379
- **Auth Token:** Stored in AWS Secrets Manager (`staging-redis-auth-token`)

#### Storage

| Resource Type | Resource Name | Configuration |
|--------------|---------------|---------------|
| S3 Bucket | `berthcare-photos-staging-ca-central-1` | Photos storage |
| S3 Bucket | `berthcare-documents-staging-ca-central-1` | Documents storage |
| Versioning | Enabled | Both buckets |
| Encryption | AES-256 (SSE-S3) | Both buckets |
| Lifecycle Policy | Glacier after 365 days | Both buckets |
| Public Access | Blocked | Both buckets |

#### CDN

| Resource Type | Resource Name/ID | Configuration |
|--------------|------------------|---------------|
| CloudFront Distribution | `berthcare-staging-cdn` | Photos CDN |
| Origin | S3 photos bucket | OAI access |
| Price Class | PriceClass_100 | North America + Europe |
| Compression | Enabled | Gzip, Brotli |
| SSL Certificate | AWS Certificate Manager | *.berthcare.ca |

**Domain:** `cdn-staging.berthcare.ca` (future)

#### IAM

| Resource Type | Resource Name | Purpose |
|--------------|---------------|---------|
| IAM Role | `berthcare-staging-backend-role` | Backend service access |
| IAM Policy | `berthcare-staging-backend-policy` | RDS, Redis, S3 access |
| IAM Policy | `berthcare-staging-secrets-policy` | Secrets Manager access |
| IAM Role | `berthcare-staging-lambda-role` | Lambda execution (future) |

#### Secrets Manager

| Secret Name | Description | Contents |
|-------------|-------------|----------|
| `staging-db-master-password` | Database password | PostgreSQL master password |
| `staging-redis-auth-token` | Redis password | Redis AUTH token |
| `staging/twilio/account` | Twilio credentials | Account SID, Auth Token |
| `staging/twilio/phone-numbers` | Twilio numbers | Voice number, SMS number |
| `staging/twilio/webhooks` | Webhook config | URLs, auth token |

**Encryption:** AES-256 with AWS KMS  
**Recovery Window:** 7 days

#### Monitoring

| Resource Type | Resource Name | Purpose |
|--------------|---------------|---------|
| CloudWatch Dashboard | `berthcare-staging-api-performance` | API metrics |
| CloudWatch Dashboard | `berthcare-staging-database` | Database metrics |
| CloudWatch Dashboard | `berthcare-staging-errors` | Error tracking |
| CloudWatch Log Group | `/berthcare/staging/backend/api` | API logs (30 days) |
| CloudWatch Log Group | `/berthcare/staging/backend/errors` | Error logs (90 days) |
| CloudWatch Alarm | `berthcare-staging-unhealthy-hosts` | Critical |
| CloudWatch Alarm | `berthcare-staging-api-error-rate-high` | High |
| CloudWatch Alarm | `berthcare-staging-db-cpu-high` | High |
| CloudWatch Alarm | `berthcare-staging-db-connections-high` | Medium |
| CloudWatch Alarm | `berthcare-staging-api-latency-high` | Medium |
| SNS Topic | `berthcare-staging-alerts` | Alarm notifications |

### Twilio Resources

| Resource Type | Resource ID | Configuration |
|--------------|-------------|---------------|
| Account | ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | Main account |
| Subaccount | ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx | Staging subaccount |
| Phone Number (Voice) | +1XXXXXXXXXX | Canadian number |
| Phone Number (SMS) | +1XXXXXXXXXX | Canadian number |
| Voice Webhook | `https://api-staging.berthcare.ca/v1/voice/webhook` | TwiML endpoint |
| Voice Status Callback | `https://api-staging.berthcare.ca/v1/voice/status` | Status updates |
| SMS Webhook | `https://api-staging.berthcare.ca/v1/sms/webhook` | SMS endpoint |
| SMS Status Callback | `https://api-staging.berthcare.ca/v1/sms/status` | Delivery status |

**Security:**
- Webhook signature validation enabled
- Custom auth token for additional security
- HTTPS only

### Sentry Resources

| Resource Type | Resource Name | Purpose |
|--------------|---------------|---------|
| Project | `berthcare-backend` | Backend error tracking |
| Project | `berthcare-mobile` | Mobile error tracking |
| DSN | `https://xxx@sentry.io/xxx` | Backend integration |
| DSN | `https://xxx@sentry.io/xxx` | Mobile integration |

**Configuration:**
- Traces sample rate: 10%
- Profiles sample rate: 10%
- Environment: staging

### GitHub Resources

| Resource Type | Resource Name | Configuration |
|--------------|---------------|---------------|
| Repository | `berthcare/berthcare` | Main repository |
| Branch Protection | `main` | Requires 1+ reviews |
| GitHub Actions | CI/CD workflows | Automated testing & deployment |
| Secrets | AWS credentials | Deployment access |
| Secrets | Sentry DSN | Error tracking |

### Local Development Resources

| Resource Type | Container Name | Configuration |
|--------------|----------------|---------------|
| PostgreSQL | `berthcare-postgres` | Port 5432 |
| Redis | `berthcare-redis` | Port 6379 |
| LocalStack | `berthcare-localstack` | Port 4566 |
| pgAdmin | `berthcare-pgadmin` | Port 5050 (optional) |
| Redis Commander | `berthcare-redis-commander` | Port 8081 (optional) |

**Docker Volumes:**
- `postgres_data` - PostgreSQL data
- `redis_data` - Redis data
- `localstack_data` - LocalStack data
- `pgadmin_data` - pgAdmin config

## Cost Analysis

### Monthly Costs (Staging)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| RDS PostgreSQL | db.t4g.medium Multi-AZ | ~$70 |
| ElastiCache Redis | cache.t4g.micro x2 | ~$30 |
| NAT Gateways | 2 gateways | ~$64 |
| S3 Storage | 100 GB | ~$3 |
| CloudFront | 100 GB transfer | ~$10 |
| Data Transfer | Outbound | ~$20 |
| Secrets Manager | 5 secrets | ~$2 |
| CloudWatch | Logs & metrics | ~$10 |
| Twilio | Voice + SMS | ~$10 |
| **Total** | | **~$219/month** |

### Monthly Costs (Production - Estimated)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| RDS PostgreSQL | db.r6g.large Multi-AZ + Read Replica | ~$350 |
| ElastiCache Redis | cache.r6g.large x3 | ~$200 |
| ECS Fargate | 2-10 tasks | ~$100 |
| NAT Gateways | 3 gateways | ~$96 |
| S3 Storage | 1 TB | ~$25 |
| CloudFront | 1 TB transfer | ~$85 |
| Data Transfer | Outbound | ~$50 |
| Secrets Manager | 5 secrets | ~$2 |
| CloudWatch | Logs & metrics | ~$30 |
| Twilio | Voice + SMS | ~$60 |
| **Total** | | **~$998/month** |

### Cost Optimization Strategies

1. **Reserved Instances:** 30-40% savings for production RDS and ElastiCache
2. **Instance Scheduler:** Stop non-production resources overnight (30% savings)
3. **S3 Intelligent-Tiering:** Automatic cost optimization for infrequently accessed data
4. **CloudWatch Log Retention:** Shorter retention for non-critical logs
5. **CloudFront Caching:** Reduce origin requests with aggressive caching

## Performance Targets

### API Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Latency (P50) | < 100ms | CloudWatch |
| API Latency (P99) | < 500ms | CloudWatch |
| Error Rate | < 1% | CloudWatch |
| Uptime | 99.5% (staging), 99.9% (production) | CloudWatch |

### Database Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Query Latency (P50) | < 10ms | CloudWatch |
| Query Latency (P99) | < 100ms | CloudWatch |
| CPU Utilization | < 70% | CloudWatch |
| Connection Pool | < 80% | CloudWatch |

### Mobile App Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| App Launch | < 2 seconds | Sentry |
| UI Response | < 100ms | Sentry |
| Auto-save | < 1 second | Sentry |
| Background Sync | < 30 seconds | Sentry |

### Communication Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Voice Call Connect | < 5 seconds | Twilio Console |
| SMS Delivery | < 15 seconds | Twilio Console |
| Push Notification | < 5 seconds | Expo Dashboard |

## Disaster Recovery

### Backup Strategy

| Resource | Backup Method | Frequency | Retention |
|----------|---------------|-----------|-----------|
| RDS PostgreSQL | Automated snapshots | Daily | 7 days (staging), 30 days (production) |
| RDS PostgreSQL | Manual snapshots | Before major changes | 90 days |
| S3 Buckets | Versioning | Continuous | 7 years (compliance) |
| Terraform State | S3 versioning | On every apply | Indefinite |
| Application Code | Git repository | On every commit | Indefinite |

### Recovery Procedures

#### Database Restore

```bash
# List available snapshots
aws rds describe-db-snapshots --db-instance-identifier berthcare-staging-db

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier berthcare-staging-db-restored \
  --db-snapshot-identifier snapshot-id

# Update DNS or connection string to point to restored instance
```

#### S3 Restore

```bash
# List object versions
aws s3api list-object-versions --bucket berthcare-photos-staging-ca-central-1

# Restore specific version
aws s3api copy-object \
  --copy-source berthcare-photos-staging-ca-central-1/path/to/file?versionId=xxx \
  --bucket berthcare-photos-staging-ca-central-1 \
  --key path/to/file
```

#### Infrastructure Rebuild

```bash
# Restore from Terraform state
cd terraform/environments/staging
terraform init
terraform plan
terraform apply

# Verify all resources created
terraform output
```

### RTO/RPO Targets

| Environment | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) |
|-------------|-------------------------------|--------------------------------|
| Staging | 4 hours | 24 hours |
| Production | 1 hour | 1 hour |

## Next Steps

### Immediate (Current Sprint)

- [x] E1: Git repository initialized
- [x] E2: CI/CD bootstrap configured
- [x] E3: Monorepo structure set up
- [x] E4: Local development environment ready
- [x] E5: AWS infrastructure deployed (staging)
- [x] E6: Monitoring and observability configured
- [x] E7: Twilio configuration completed
- [x] E8: Architecture documentation updated

### Phase T (Backend Implementation)

- [ ] T1: Backend core infrastructure
- [ ] T2: Twilio Voice client implementation
- [ ] T3: Voice alert endpoints
- [ ] T4: SMS client implementation
- [ ] T5: SMS endpoints
- [ ] T6: Backend testing

### Phase M (Mobile Implementation)

- [ ] M1: Mobile app scaffolding
- [ ] M2: Offline-first data layer
- [ ] M3: Authentication
- [ ] M4: Visit documentation
- [ ] M5: Sync engine
- [ ] M6: Mobile testing

### Phase F (Family Portal)

- [ ] F1: Family portal scaffolding
- [ ] F2: Read-only client views
- [ ] F3: Daily SMS messages
- [ ] F4: SMS reply processing
- [ ] F5: Family portal testing

## References

### Documentation

- [README](../README.md) - Project overview
- [Local Setup Guide](./local-setup.md) - Development environment
- [CI/CD Setup](./ci-setup.md) - Continuous integration
- [Twilio Setup](./twilio-setup.md) - Communication services
- [Monitoring Setup](./monitoring-setup.md) - Observability
- [Twilio Quick Reference](./twilio-quick-reference.md) - Common operations
- [Monitoring Quick Reference](./monitoring-quick-reference.md) - Monitoring commands

### Completion Summaries

- [E2 Completion Summary](./E2-completion-summary.md)
- [E3 Completion Summary](./E3-completion-summary.md)
- [E4 Completion Summary](./E4-completion-summary.md)
- [E5 Completion Summary](./E5-completion-summary.md)
- [E6 Completion Summary](./E6-completion-summary.md)
- [E7 Completion Summary](./E7-completion-summary.md)

### External Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [PIPEDA Compliance Guide](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)
- [Twilio Documentation](https://www.twilio.com/docs)
- [Sentry Documentation](https://docs.sentry.io/)

---

**Document Version:** 2.0.0  
**Last Updated:** October 7, 2025  
**Maintained By:** DevOps Team  
**Status:** Staging Infrastructure Deployed

**Philosophy:** "Simplicity is the ultimate sophistication. Start with the user experience, then work backwards to the technology."

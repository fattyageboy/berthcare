# BerthCare Backend API

> "Simplicity is the ultimate sophistication" - Express.js REST API with TypeScript

## Overview

Production-ready Express.js 4.x backend API with comprehensive monitoring, security, and performance optimizations.

## Features

### Core Framework
- **Express.js 4.x** - Fast, unopinionated web framework
- **TypeScript** - Type-safe development
- **Node.js 20 LTS** - Latest stable runtime

### Security Middleware
- **Helmet** - Security headers (XSS, clickjacking, etc.)
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevent abuse (100 requests per 15 minutes)
- **Input Validation** - Request body size limits (10MB)

### Performance Optimization
- **Compression** - Gzip/Deflate response compression
- **Connection Pooling** - PostgreSQL connection pool (2-20 connections)
- **Redis Caching** - Sub-millisecond response times
- **Efficient Logging** - Structured JSON logs

### Monitoring & Observability
- **Winston Logging** - Structured logging with context
- **Sentry Integration** - Error tracking and performance monitoring
- **CloudWatch Metrics** - API latency, error rates, request counts
- **Health Checks** - `/health` endpoint with dependency status

### Data Layer
- **PostgreSQL 15** - ACID-compliant relational database
- **Redis 7** - High-performance caching and session management
- **AWS S3** - File storage with pre-signed URLs (photos, signatures, documents)

## Quick Start

### Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose (for local services)
- PostgreSQL 15 (via Docker)
- Redis 7 (via Docker)

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp ../../.env.example ../../.env

# Start local services (PostgreSQL, Redis, LocalStack)
docker-compose up -d

# Start development server
npm run dev
```

### Verify Installation

```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-10-07T...",
#   "uptime": 42,
#   "memory": { ... },
#   "checks": {
#     "database": { "healthy": true, "latency": 5 },
#     "cache": { "healthy": true, "latency": 2 }
#   },
#   "version": "1.0.0"
# }
```

Or use the test script:

```bash
./test-health.sh
```

## API Endpoints

### Health & Monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with dependency status |
| `/metrics` | GET | Prometheus-compatible metrics |
| `/api/v1/status` | GET | API status and version |

### Storage (S3)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/storage/photos/upload-url` | POST | Generate pre-signed URL for photo upload |
| `/api/v1/storage/photos/batch-upload-urls` | POST | Generate multiple upload URLs (batch) |
| `/api/v1/storage/signatures/upload-url` | POST | Generate pre-signed URL for signature upload |
| `/api/v1/storage/download-url` | POST | Generate pre-signed URL for file download |
| `/api/v1/storage/metadata/*` | GET | Get file metadata |
| `/api/v1/storage/exists/*` | GET | Check if file exists |

See [Storage Quick Reference](../../docs/storage-quick-reference.md) for detailed usage.

### Rate Limiting

All endpoints are rate-limited to prevent abuse:
- **Window:** 15 minutes (configurable via `RATE_LIMIT_WINDOW_MS`)
- **Max Requests:** 100 per IP (configurable via `RATE_LIMIT_MAX_REQUESTS`)
- **Response:** 429 Too Many Requests with retry-after header

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Express.js Application                                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Middleware Stack                                    │    │
│  │  1. Helmet (Security)                                │    │
│  │  2. CORS (Cross-origin)                              │    │
│  │  3. Compression (Gzip)                               │    │
│  │  4. Rate Limiting (Abuse prevention)                 │    │
│  │  5. Body Parser (JSON/URL-encoded)                   │    │
│  │  6. Sentry Request Handler                           │    │
│  │  7. Request ID & Timing                              │    │
│  │  8. Request/Response Logging                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Route Handlers                                      │    │
│  │  - Health checks                                     │    │
│  │  - API endpoints (TODO)                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Error Handling                                      │    │
│  │  - 404 handler                                       │    │
│  │  - Sentry error handler                              │    │
│  │  - Global error middleware                           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Data Layer                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │  Redis       │  │  S3 Storage  │      │
│  │  (Database)  │  │  (Cache)     │  │  (Files)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
apps/backend/
├── src/
│   ├── index.ts                 # Main application entry point
│   ├── cache/
│   │   └── index.ts            # Redis connection and utilities
│   ├── database/
│   │   └── index.ts            # PostgreSQL connection and queries
│   ├── storage/
│   │   ├── index.ts            # S3 storage module
│   │   └── README.md           # Storage documentation
│   ├── routes/
│   │   └── storage.ts          # Storage API routes
│   ├── middleware/
│   │   └── monitoring.ts       # Request tracking and error handling
│   └── monitoring/
│       ├── index.ts            # Monitoring exports
│       ├── logger.ts           # Winston structured logger
│       ├── metrics.ts          # CloudWatch metrics publisher
│       └── sentry.ts           # Sentry error tracking
├── scripts/
│   └── setup-s3-lifecycle.sh   # S3 lifecycle policy setup
├── examples/
│   └── photo-upload-flow.md    # Photo upload integration example
├── package.json                # Backend dependencies
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Jest test configuration
├── project.json                # Nx project configuration
├── test-health.sh              # Health check test script
├── test-s3.js                  # S3 storage test script
└── README.md                   # This file
```

## Environment Variables

Key configuration options (see `../../.env.example` for full list):

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=berthcare_dev
DATABASE_USER=berthcare
DATABASE_PASSWORD=berthcare_local_dev_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=berthcare_redis_password

# AWS S3
AWS_REGION=ca-central-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET=berthcare-dev
AWS_S3_ENDPOINT=http://localhost:4566  # LocalStack for local dev
AWS_S3_FORCE_PATH_STYLE=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # 100 requests per window

# Monitoring
SENTRY_DSN=https://...           # Sentry error tracking
CLOUDWATCH_ENABLED=false         # CloudWatch metrics (production only)
LOG_LEVEL=debug                  # debug, info, warn, error
```

## Development

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production build
npm run build
npm start
```

### Testing

```bash
# Run all tests
npm test

# Test specific components
npm run test:redis      # Test Redis connection
npm run test:database   # Test PostgreSQL connection
npm run test:s3         # Test S3 storage module
npm run test:health     # Test health endpoint

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting & Type Checking

```bash
# Lint code
npm run lint

# Type check
npm run type-check
```

## Monitoring

### Structured Logging

All logs are output in JSON format for easy parsing:

```json
{
  "timestamp": "2025-10-07T12:34:56.789Z",
  "level": "INFO",
  "service": "berthcare-api",
  "environment": "development",
  "message": "API Request: GET /health",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/health"
}
```

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T12:34:56.789Z",
  "uptime": 3600,
  "memory": {
    "heapUsed": 45,
    "heapTotal": 89,
    "rss": 123
  },
  "checks": {
    "database": {
      "healthy": true,
      "latency": 5,
      "error": null
    },
    "cache": {
      "healthy": true,
      "latency": 2,
      "error": null
    },
    "storage": {
      "healthy": true,
      "latency": 45,
      "message": "S3 connection successful"
    }
  },
  "version": "1.0.0"
}
```

### Metrics

CloudWatch metrics are published for:
- API latency (P50, P95, P99)
- Request count by status code
- Error rate
- Database query duration
- Cache hit/miss ratio

## Security

### Implemented Protections

- **Helmet** - Sets security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- **CORS** - Restricts cross-origin requests to allowed origins
- **Rate Limiting** - Prevents brute force and DDoS attacks
- **Input Validation** - Limits request body size to prevent memory exhaustion
- **Error Sanitization** - Hides internal errors in production

### Best Practices

- Never commit `.env` files
- Use environment variables for secrets
- Rotate JWT secrets regularly
- Monitor error rates and unusual patterns
- Keep dependencies updated

## Deployment

### Docker

```bash
# Build image
docker build -t berthcare-backend .

# Run container
docker run -p 3000:3000 --env-file .env berthcare-backend
```

### AWS ECS Fargate

See `terraform/` directory for infrastructure as code.

## Troubleshooting

### Server won't start

1. Check if port 3000 is already in use:
   ```bash
   lsof -i :3000
   ```

2. Verify environment variables are set:
   ```bash
   cat .env
   ```

3. Check Docker services are running:
   ```bash
   docker-compose ps
   ```

### Database connection errors

1. Verify PostgreSQL is running:
   ```bash
   docker-compose ps postgres
   ```

2. Test connection manually:
   ```bash
   psql postgresql://berthcare:berthcare_local_dev_password@localhost:5432/berthcare_dev
   ```

### Redis connection errors

1. Verify Redis is running:
   ```bash
   docker-compose ps redis
   ```

2. Test connection manually:
   ```bash
   redis-cli -h localhost -p 6379 -a berthcare_redis_password PING
   ```

## Completed Features

- [x] Express.js server with TypeScript
- [x] PostgreSQL database connection
- [x] Redis caching layer
- [x] S3 storage with pre-signed URLs
- [x] Comprehensive monitoring (Sentry, CloudWatch, Winston)
- [x] Health checks for all dependencies
- [x] Security middleware (Helmet, CORS, Rate Limiting)
- [x] Structured logging
- [x] Error handling and tracking

## Next Steps

- [ ] Implement authentication endpoints (`/api/v1/auth`)
- [ ] Add client management endpoints (`/api/v1/clients`)
- [ ] Add visit management endpoints (`/api/v1/visits`)
- [ ] Add sync endpoints (`/api/v1/sync`)
- [ ] Add database migrations for visit schema
- [ ] Add integration tests
- [ ] Add API documentation (Swagger/OpenAPI)

## References

### Documentation
- [Architecture Documentation](../../docs/architecture.md)
- [Local Setup Guide](../../docs/local-setup.md)
- [Monitoring Setup](../../docs/monitoring-setup.md)
- [Storage Quick Reference](../../docs/storage-quick-reference.md)
- [Database Quick Reference](../../docs/database-quick-reference.md)
- [Redis Quick Reference](../../docs/redis-quick-reference.md)

### Completion Summaries
- [B1: Database Setup](../../docs/B1-completion-summary.md)
- [B2: Redis Cache Setup](../../docs/B2-completion-summary.md)
- [B3: Monitoring Setup](../../docs/B3-completion-summary.md)
- [B4: S3 Storage Setup](../../docs/B4-completion-summary.md)

### External Resources
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [AWS SDK v3 Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

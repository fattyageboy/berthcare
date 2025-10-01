# BerthCare Backend Services

Node.js/TypeScript microservices backend for the BerthCare maritime nursing visit documentation system.

## Architecture

This backend follows a microservices architecture with the following services:

- **User Service** (Port 3001): User authentication, authorization, and profile management
- **Visit Service** (Port 3002): Visit documentation, records, and clinical data management
- **Sync Service** (Port 3003): Offline data synchronization and conflict resolution
- **Notification Service** (Port 3004): Push notifications, alerts, and messaging

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript with strict mode
- **Framework**: Express.js
- **Security**: Helmet, CORS, express-rate-limit
- **Validation**: express-validator
- **Database**: PostgreSQL 14+ (via pg driver with connection pooling)
- **Caching**: Redis (via ioredis)
- **Connection Pooling**: PgBouncer (recommended for production)

## Project Structure

```
/backend
  /src
    /services       - Individual microservices
      /user         - User management service
      /visit        - Visit documentation service
      /sync         - Offline sync service
      /notification - Notification service
    /shared         - Shared utilities, types, middleware
    /config         - Configuration management
  /tests
    /unit           - Unit tests
    /integration    - Integration tests
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+
- Redis 6+

### Installation

```bash
npm install
```

### Database Setup

#### 1. Install PostgreSQL and Redis

**macOS (via Homebrew):**
```bash
brew install postgresql@14 redis
brew services start postgresql@14
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql-14 redis-server
sudo systemctl start postgresql
sudo systemctl start redis-server
```

**Docker (Recommended for Development):**
```bash
# Using the provided docker-compose.dev.yml
docker-compose -f docker-compose.dev.yml up -d postgres redis
```

#### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE berthcare;

# Create user (if needed)
CREATE USER berthcare_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE berthcare TO berthcare_user;

# Exit psql
\q
```

#### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env` and set:
```bash
# Option 1: Use DATABASE_URL connection string (recommended)
DATABASE_URL=postgresql://postgres:password@localhost:5432/berthcare

# Option 2: Use individual parameters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=berthcare
DB_USER=postgres
DB_PASSWORD=your_password

# Redis configuration
REDIS_URL=redis://localhost:6379
```

#### 4. Verify Database Connection

Start a service and check the health endpoints:

```bash
# Start user service
npx ts-node src/services/user

# In another terminal, check database health
curl http://localhost:3001/health/db

# Check Redis health
curl http://localhost:3001/health/redis
```

Expected response (200 OK):
```json
{
  "success": true,
  "message": "Database connection healthy",
  "data": {
    "connected": true,
    "latencyMs": 5,
    "poolStats": {
      "total": 2,
      "idle": 2,
      "waiting": 0
    },
    "timestamp": "2025-09-30T12:00:00.000Z"
  }
}
```

#### 5. Database Connection Pooling

The application uses connection pooling by default. Configure pool settings in `.env`:

```bash
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT=5000
DATABASE_IDLE_TIMEOUT=30000
DATABASE_STATEMENT_TIMEOUT=30000
```

For production deployments with PgBouncer, see [docs/pgbouncer-config.md](./docs/pgbouncer-config.md).

### Development

Start individual services:

```bash
# User service
npx ts-node src/services/user

# Visit service
npx ts-node src/services/visit

# Sync service
npx ts-node src/services/sync

# Notification service
npx ts-node src/services/notification
```

Or use nodemon for auto-reload:

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
npm run lint:fix
```

### Format

```bash
npm run format
npm run format:check
```

## Environment Variables

Copy `.env.example` to `.env` and configure. See `.env.example` for a complete list of available configuration options.

**Required Variables:**
- `DATABASE_URL` or individual `DB_*` parameters
- `REDIS_URL` or individual `REDIS_*` parameters
- `JWT_SECRET` (must be changed in production)

**Optional Variables:**
- Connection pool settings
- Service ports
- Logging level
- CORS origins

See the [Database Setup](#database-setup) section for detailed configuration instructions.

## API Documentation

Each service exposes:

- `GET /health` - Service health check endpoint
- `GET /health/db` - Database connection health check
- `GET /health/redis` - Redis connection health check
- `GET /api/*` - Service-specific endpoints

**Service Health Check** (`GET /health`):

```json
{
  "status": "healthy",
  "timestamp": "2025-09-30T12:00:00.000Z",
  "service": "user-service",
  "version": "1.0.0",
  "uptime": 123.45
}
```

**Database Health Check** (`GET /health/db`):

Success (200):
```json
{
  "success": true,
  "message": "Database connection healthy",
  "data": {
    "connected": true,
    "latencyMs": 5,
    "poolStats": {
      "total": 10,
      "idle": 8,
      "waiting": 0
    },
    "timestamp": "2025-09-30T12:00:00.000Z"
  }
}
```

Failure (503):
```json
{
  "success": false,
  "message": "Database connection failed: Connection timeout",
  "error": "Database connection failed",
  "data": {
    "connected": false,
    "latencyMs": 5000,
    "timestamp": "2025-09-30T12:00:00.000Z"
  }
}
```

**Redis Health Check** (`GET /health/redis`):

Success (200):
```json
{
  "success": true,
  "message": "Redis connection healthy",
  "data": {
    "connected": true,
    "latencyMs": 2,
    "serverInfo": {
      "version": "6.2.6",
      "uptime": 86400,
      "connectedClients": 5,
      "usedMemory": "1.2M"
    },
    "timestamp": "2025-09-30T12:00:00.000Z"
  }
}
```

## Development Guidelines

- Use TypeScript strict mode
- Follow ESLint and Prettier configurations
- Write unit tests for business logic
- Document all public APIs
- Use shared types and utilities from `/shared`
- Handle errors using ApiError class
- Log using provided middleware

## License

MIT

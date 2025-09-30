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
- **Database**: PostgreSQL (via pg driver)

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
- PostgreSQL 15+

### Installation

```bash
npm install
```

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

Copy `.env.example` to `.env` and configure:

```
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=berthcare
DB_USER=postgres
DB_PASSWORD=postgres

# Security
ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# Service Ports
USER_SERVICE_PORT=3001
VISIT_SERVICE_PORT=3002
SYNC_SERVICE_PORT=3003
NOTIFICATION_SERVICE_PORT=3004
```

## API Documentation

Each service exposes:

- `GET /health` - Health check endpoint
- `GET /api/*` - Service-specific endpoints

Health check response format:

```json
{
  "status": "healthy",
  "timestamp": "2025-09-30T12:00:00.000Z",
  "service": "user-service",
  "version": "1.0.0",
  "uptime": 123.45
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

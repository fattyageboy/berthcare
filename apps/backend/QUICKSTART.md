# BerthCare Backend - Quick Start Guide

> Get up and running in 5 minutes

## Prerequisites

- Node.js 20+ installed
- Docker Desktop running
- Terminal/Command line access

## Step 1: Install Dependencies

```bash
cd apps/backend
npm install
```

## Step 2: Configure Environment

```bash
# From project root
cp .env.example .env
```

The default values work for local development - no changes needed!

## Step 3: Start Local Services

```bash
# From project root
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- LocalStack (S3) on port 4566

## Step 4: Start Backend Server

```bash
# From apps/backend directory
npm run dev
```

You should see:
```
{"timestamp":"2025-10-07T...","level":"INFO","service":"berthcare-api","message":"BerthCare API started","port":3000,"environment":"development"}
```

## Step 5: Test the API

### Option A: Using curl

```bash
curl http://localhost:3000/health
```

### Option B: Using the test script

```bash
./test-health.sh
```

### Option C: Using your browser

Open: http://localhost:3000/health

## Expected Response

```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T12:34:56.789Z",
  "uptime": 42,
  "memory": {
    "heapUsed": 45,
    "heapTotal": 89,
    "rss": 123
  },
  "checks": {
    "database": {
      "healthy": true,
      "latency": 5
    },
    "cache": {
      "healthy": true,
      "latency": 2
    }
  },
  "version": "1.0.0"
}
```

## Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with dependency status |
| `/metrics` | GET | Prometheus-compatible metrics |
| `/api/v1/status` | GET | API status and version |

## Troubleshooting

### Port 3000 already in use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database connection failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis connection failed

```bash
# Check if Redis is running
docker-compose ps redis

# Restart Redis
docker-compose restart redis
```

### Clean slate reset

```bash
# Stop all services and remove data
docker-compose down -v

# Start fresh
docker-compose up -d
npm run dev
```

## Development Workflow

### Making Changes

1. Edit files in `src/`
2. Server auto-reloads (if using nodemon)
3. Test your changes
4. Check logs for errors

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

## Next Steps

- Read the [Backend README](./README.md) for detailed documentation
- Review the [Architecture Documentation](../../docs/architecture.md)
- Check out the [Task Plan](../../project-documentation/task-plan.md)

## Need Help?

- Check the [Troubleshooting](#troubleshooting) section above
- Review logs in the console
- Check Docker service status: `docker-compose ps`
- Verify environment variables: `cat ../../.env`

---

**You're all set!** 🚀 The backend is running and ready for development.

# BerthCare Local Development Setup

**Philosophy:** "If users need a manual, the design has failed" - This setup should just work.

## Quick Start

Get the entire development environment running in 3 commands:

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Start all services
docker-compose up --build

# 3. Verify everything is running
docker-compose ps
```

That's it! All services are now running and ready for development.

## What Gets Started

When you run `docker-compose up`, you get:

### Core Services (Always Running)

1. **PostgreSQL 15** - Server database
   - Port: `5432`
   - Database: `berthcare_dev`
   - User: `berthcare`
   - Password: `berthcare_local_dev_password`
   - Connection: `postgresql://berthcare:berthcare_local_dev_password@localhost:5432/berthcare_dev`

2. **Redis 7** - Caching and session management
   - Port: `6379`
   - Password: `berthcare_redis_password`
   - Connection: `redis://:berthcare_redis_password@localhost:6379/0`

3. **LocalStack** - AWS S3 emulation
   - Port: `4566`
   - Bucket: `berthcare-dev`
   - Endpoint: `http://localhost:4566`
   - Region: `ca-central-1`

### Optional Development Tools

Start these with the `--profile tools` flag:

```bash
docker-compose --profile tools up
```

4. **pgAdmin** - PostgreSQL web interface
   - URL: `http://localhost:5050`
   - Email: `dev@berthcare.local`
   - Password: `admin`

5. **Redis Commander** - Redis web interface
   - URL: `http://localhost:8081`

## Service Health Checks

All services include health checks. Verify they're healthy:

```bash
# Check all services
docker-compose ps

# Should show all services as "healthy"
```

## Connecting from Backend

Your backend application can connect using these environment variables (already in `.env.example`):

```bash
# PostgreSQL
DATABASE_URL=postgresql://berthcare:berthcare_local_dev_password@localhost:5432/berthcare_dev

# Redis
REDIS_URL=redis://:berthcare_redis_password@localhost:6379/0

# S3 (LocalStack)
AWS_S3_ENDPOINT=http://localhost:4566
AWS_S3_BUCKET=berthcare-dev
AWS_REGION=ca-central-1
```

## Common Commands

### Start Services

```bash
# Start all services (foreground)
docker-compose up

# Start all services (background)
docker-compose up -d

# Start with development tools
docker-compose --profile tools up -d

# Rebuild and start
docker-compose up --build
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f localstack
```

### Database Operations

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U berthcare -d berthcare_dev

# Run SQL file
docker-compose exec -T postgres psql -U berthcare -d berthcare_dev < your-script.sql

# Backup database
docker-compose exec postgres pg_dump -U berthcare berthcare_dev > backup.sql

# Restore database
docker-compose exec -T postgres psql -U berthcare -d berthcare_dev < backup.sql
```

### Redis Operations

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli -a berthcare_redis_password

# Flush all data
docker-compose exec redis redis-cli -a berthcare_redis_password FLUSHALL
```

### S3 Operations (LocalStack)

```bash
# Install AWS CLI (if not already installed)
pip install awscli-local

# List buckets
awslocal s3 ls

# List files in bucket
awslocal s3 ls s3://berthcare-dev/

# Upload file
awslocal s3 cp test.jpg s3://berthcare-dev/photos/

# Download file
awslocal s3 cp s3://berthcare-dev/photos/test.jpg ./
```

## Troubleshooting

### Services Won't Start

**Problem:** Port already in use

```bash
# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :4566  # LocalStack

# Kill the process or change the port in docker-compose.yml
```

**Problem:** Docker daemon not running

```bash
# Start Docker Desktop or Docker daemon
# macOS: Open Docker Desktop
# Linux: sudo systemctl start docker
```

### Database Connection Issues

**Problem:** Backend can't connect to PostgreSQL

```bash
# Verify PostgreSQL is healthy
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U berthcare -d berthcare_dev -c "SELECT 1;"
```

### Redis Connection Issues

**Problem:** Backend can't connect to Redis

```bash
# Verify Redis is healthy
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli -a berthcare_redis_password PING
# Should return: PONG
```

### LocalStack S3 Issues

**Problem:** S3 operations failing

```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# Verify bucket exists
awslocal s3 ls

# Recreate bucket
awslocal s3 mb s3://berthcare-dev
```

### Clean Slate Reset

If everything is broken, start fresh:

```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up --build
```

## Data Persistence

Data is persisted in Docker volumes:

- `postgres_data` - PostgreSQL database files
- `redis_data` - Redis persistence files
- `localstack_data` - LocalStack S3 files
- `pgadmin_data` - pgAdmin configuration

To completely reset (delete all data):

```bash
docker-compose down -v
```

## Performance Tips

### macOS Performance

If you're on macOS and experiencing slow performance:

1. **Increase Docker resources:**
   - Docker Desktop → Settings → Resources
   - Increase CPUs to 4+
   - Increase Memory to 8GB+

2. **Use named volumes (already configured):**
   - Named volumes are faster than bind mounts on macOS

### Database Performance

For faster local development:

```bash
# Disable fsync (development only!)
docker-compose exec postgres psql -U berthcare -d berthcare_dev -c "ALTER SYSTEM SET fsync = off;"
docker-compose restart postgres
```

**Warning:** Never disable fsync in production!

## Integration with Backend

Once services are running, your backend can connect immediately:

```typescript
// Example: apps/backend/src/config/database.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection will work immediately with docker-compose services
});

export default pool;
```

## Next Steps

1. **Start services:** `docker-compose up -d`
2. **Verify health:** `docker-compose ps`
3. **Run backend:** `npm run dev:backend`
4. **Start building!**

## Architecture Reference

For detailed information about the data layer architecture, see:
- [Architecture Blueprint](../project-documentation/architecture-output.md) - Data Layer section
- [Task Plan](../project-documentation/task-plan.md) - E4 task details

## Philosophy

> "The best interface is no interface. Make technology invisible."

This local development setup embodies BerthCare's design philosophy:

- **No manual configuration needed** - Intelligent defaults work out of the box
- **No complex setup steps** - One command starts everything
- **No waiting** - Services start in parallel with health checks
- **No surprises** - Clear error messages and troubleshooting guides

The infrastructure should be invisible. You should be able to focus on building features, not fighting with Docker.

---

**Questions or issues?** Check the troubleshooting section above or reach out to the team.

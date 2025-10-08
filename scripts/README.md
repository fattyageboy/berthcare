# BerthCare Development Scripts

This directory contains initialization and utility scripts for local development.

## Scripts

### `init-db.sql`
PostgreSQL database initialization script that runs automatically when the database container starts.

**What it does:**
- Creates required PostgreSQL extensions (uuid-ossp, pgcrypto)
- Sets up schemas (berthcare, audit)
- Creates audit logging infrastructure
- Configures permissions

**Usage:** Runs automatically via Docker Compose

### `init-s3.sh`
LocalStack S3 initialization script that creates buckets and folder structure.

**What it does:**
- Creates `berthcare-dev` S3 bucket
- Sets up folder structure (photos/, signatures/, documents/)
- Configures CORS for local development

**Usage:** Runs automatically via Docker Compose

## Manual Execution

If you need to run these scripts manually:

```bash
# Database initialization
docker-compose exec -T postgres psql -U berthcare -d berthcare_dev < scripts/init-db.sql

# S3 initialization
docker-compose exec localstack /etc/localstack/init/ready.d/init-s3.sh
```

## Adding New Scripts

When adding new initialization scripts:

1. Place them in this directory
2. Make them executable: `chmod +x scripts/your-script.sh`
3. Add them to docker-compose.yml volumes if needed
4. Document them in this README

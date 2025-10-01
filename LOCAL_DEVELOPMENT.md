# BerthCare Local Development Environment

This guide will help you set up the BerthCare application for local development using Docker Compose.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Berthcare
```

### 2. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and update the following required values:
- `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` (from your Auth0 dashboard)
- Change default passwords for production use
- Other values have sensible defaults for local development

### 3. Start the Development Environment

Start all services using Docker Compose:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This will start:
- **PostgreSQL** database on port `5432`
- **Redis** cache on port `6379`
- **MinIO** S3-compatible storage on ports `9000` (API) and `9001` (Console)
- **Adminer** database UI on port `8080`
- **Redis Commander** on port `8081`

### 4. Verify Services Are Running

Check that all services are healthy:

```bash
docker-compose -f docker-compose.dev.yml ps
```

All services should show status as "healthy" or "running".

### 5. Access the Services

Once all services are running, you can access:

| Service         | URL                     | Credentials                                                                                    |
|-----------------|-------------------------|------------------------------------------------------------------------------------------------|
| PostgreSQL      | `localhost:5432`        | User: `postgres`<br>Password: `dev_password_change_in_production`<br>Database: `berthcare_dev` |
| Redis           | `localhost:6379`        | Password: `dev_redis_password`                                                                 |
| MinIO API       | `http://localhost:9000` | Access Key: `minioadmin`<br>Secret Key: `minioadmin123`                                        |
| MinIO Console   | `http://localhost:9001` | Username: `minioadmin`<br>Password: `minioadmin123`                                            |
| Adminer (DB UI) | `http://localhost:8080` | Use PostgreSQL credentials                                                                     |
| Redis Commander | `http://localhost:8081` | No authentication required                                                                     |

## Database Setup

### Schema and Seed Data

The database schema and seed data are automatically loaded when the PostgreSQL container starts for the first time. The initialization scripts are located in `/db/seeds`:

- `01_schema.sql` - Creates all tables, types, indexes, and views
- `02_seed_data.sql` - Loads development test data

### Seed Data Includes

The development database comes pre-populated with:

- **2 Organizations** - Sample healthcare organizations
- **11 Users** - Various roles (admin, supervisor, coordinator, nurses, PSWs, family members)
- **5 Clients** - Realistic client profiles with medical conditions
- **3 Care Plans** - Active care plans with detailed interventions
- **10+ Visits** - Past, current, and future scheduled visits
- **Family Member Relationships** - Linked family members with access levels

### Database Schema Overview

The schema includes the following main tables:

| Table | Description |
|-------|-------------|
| `organizations` | Healthcare organizations |
| `users` | System users (caregivers, admins, family) |
| `clients` | Care recipients |
| `care_plans` | Structured care plans |
| `visits` | Scheduled and completed visits |
| `family_members` | Family member relationships |
| `sync_log` | Offline sync tracking |
| `audit_log` | Compliance and audit trail |

### Accessing the Database

#### Using Adminer (Web UI)

1. Navigate to `http://localhost:8080`
2. Select "PostgreSQL" as the system
3. Enter the following credentials:
   - **Server**: `db`
   - **Username**: `postgres`
   - **Password**: `dev_password_change_in_production`
   - **Database**: `berthcare_dev`

#### Using psql (Command Line)

```bash
docker exec -it berthcare-postgres psql -U postgres -d berthcare_dev
```

Useful psql commands:
```sql
-- List all tables
\dt

-- Describe a table
\d users

-- View all clients
SELECT * FROM clients;

-- View active visits
SELECT * FROM active_visits_view;

-- View client summary
SELECT * FROM client_summary_view;
```

## Working with MinIO (S3 Storage)

### Accessing MinIO Console

1. Navigate to `http://localhost:9001`
2. Login with credentials:
   - **Username**: `minioadmin`
   - **Password**: `minioadmin123`

### Pre-created Buckets

The following buckets are automatically created:

- `berthcare-dev-photos` - Client and visit photos
- `berthcare-dev-documents` - Care plans and documentation
- `berthcare-dev-signatures` - Digital signatures

### Uploading Test Files

You can upload test files through the MinIO Console or programmatically using the AWS SDK:

```javascript
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: 'http://localhost:9000',
  accessKeyId: 'minioadmin',
  secretAccessKey: 'minioadmin123',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

// Upload a file
s3.upload({
  Bucket: 'berthcare-dev-photos',
  Key: 'test-photo.jpg',
  Body: fileBuffer
}, (err, data) => {
  console.log(err || data);
});
```

## Working with Redis

### Accessing Redis Commander

Navigate to `http://localhost:8081` to view and manage Redis data through a web interface.

### Using Redis CLI

```bash
docker exec -it berthcare-redis redis-cli -a dev_redis_password
```

Common Redis commands:
```bash
# List all keys
KEYS *

# Get a key
GET key_name

# Set a key
SET key_name value

# Delete a key
DEL key_name

# Check memory usage
INFO memory
```

## Managing the Environment

### Starting Services

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Start specific service
docker-compose -f docker-compose.dev.yml up -d db
```

### Stopping Services

```bash
# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (WARNING: This deletes all data)
docker-compose -f docker-compose.dev.yml down -v
```

### Viewing Logs

```bash
# View logs for all services
docker-compose -f docker-compose.dev.yml logs -f

# View logs for specific service
docker-compose -f docker-compose.dev.yml logs -f db
docker-compose -f docker-compose.dev.yml logs -f redis
docker-compose -f docker-compose.dev.yml logs -f minio
```

### Restarting Services

```bash
# Restart all services
docker-compose -f docker-compose.dev.yml restart

# Restart specific service
docker-compose -f docker-compose.dev.yml restart db
```

### Health Checks

Check the health status of all services:

```bash
docker-compose -f docker-compose.dev.yml ps
```

All services have health checks configured:
- **PostgreSQL**: Checks database connectivity
- **Redis**: Verifies Redis is responding
- **MinIO**: Checks MinIO health endpoint

## Resetting the Database

If you need to reset the database to its initial state:

```bash
# Stop services and remove volumes
docker-compose -f docker-compose.dev.yml down -v

# Start services again (this will recreate and reseed the database)
docker-compose -f docker-compose.dev.yml up -d
```

## Troubleshooting

### Services Won't Start

1. Check if Docker Desktop is running
2. Ensure ports are not already in use:
   ```bash
   lsof -i :5432  # PostgreSQL
   lsof -i :6379  # Redis
   lsof -i :9000  # MinIO
   ```
3. Check Docker logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs
   ```

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   docker-compose -f docker-compose.dev.yml ps db
   ```
2. Check PostgreSQL logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs db
   ```
3. Test connection:
   ```bash
   docker exec -it berthcare-postgres pg_isready -U postgres
   ```

### MinIO Connection Issues

1. Verify MinIO is running:
   ```bash
   docker-compose -f docker-compose.dev.yml ps minio
   ```
2. Check MinIO health:
   ```bash
   curl http://localhost:9000/minio/health/live
   ```

### Redis Connection Issues

1. Verify Redis is running:
   ```bash
   docker-compose -f docker-compose.dev.yml ps redis
   ```
2. Test connection:
   ```bash
   docker exec -it berthcare-redis redis-cli -a dev_redis_password ping
   ```
   Should return: `PONG`

### Database Seed Data Not Loading

1. Check if seed scripts exist:
   ```bash
   ls -la db/seeds/
   ```
2. Verify scripts have correct permissions:
   ```bash
   chmod +r db/seeds/*.sql
   ```
3. Recreate database with fresh seed data:
   ```bash
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up -d
   ```

## Development Best Practices

### Environment Variables

- Never commit `.env` file to version control
- Keep `.env.example` updated with new variables
- Use strong passwords for production environments
- Document all environment variables

### Database Migrations

When making schema changes:
1. Create a new migration file
2. Test migration locally
3. Update seed data if needed
4. Document breaking changes

### Data Backup

Backup your local development data:

```bash
# Backup PostgreSQL
docker exec berthcare-postgres pg_dump -U postgres berthcare_dev > backup.sql

# Restore PostgreSQL
docker exec -i berthcare-postgres psql -U postgres berthcare_dev < backup.sql
```

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [MinIO Documentation](https://min.io/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Support

If you encounter issues not covered in this guide:

1. Check the main project README
2. Review architecture documentation in `project-documentation/`
3. Contact the development team

---

**Last Updated**: 2024-09-30
**Version**: 1.0.0

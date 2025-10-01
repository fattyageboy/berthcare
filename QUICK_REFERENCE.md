# BerthCare Local Development - Quick Reference

## Initial Setup (First Time)

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Run automated setup script
./scripts/setup-dev.sh

# That's it! Your environment is ready.
```

## Daily Commands

```bash
# Start environment
make up

# Check status
make status

# View logs
make logs

# Stop environment
make down
```

## Database Access

### Web UI (Adminer)
- URL: http://localhost:8080
- Server: `db`
- Username: `postgres`
- Password: `dev_password_change_in_production`
- Database: `berthcare_dev`

### Command Line
```bash
# Access PostgreSQL shell
make db-shell

# Useful queries
SELECT * FROM users;
SELECT * FROM clients;
SELECT * FROM active_visits_view;
SELECT * FROM client_summary_view;

# Exit shell
\q
```

### Backup/Restore
```bash
# Backup database
make db-backup

# Restore database
make db-restore
```

## Redis Access

### Web UI (Redis Commander)
- URL: http://localhost:8081

### Command Line
```bash
# Access Redis CLI
make redis-shell

# Common commands
KEYS *
GET key_name
SET key_name value
DEL key_name

# Exit shell
exit
```

## MinIO S3 Storage

### Web Console
- URL: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin123`

### Buckets (Auto-created)
- `berthcare-dev-photos`
- `berthcare-dev-documents`
- `berthcare-dev-signatures`

### API Endpoint
- URL: `http://localhost:9000`
- Access Key: `minioadmin`
- Secret Key: `minioadmin123`

## Testing & Verification

```bash
# Run comprehensive tests
./scripts/verify-environment.sh

# Test individual services
make test-db
make test-redis
make test-minio
make test-all
```

## Troubleshooting

```bash
# Restart services
make restart

# View service logs
docker-compose -f docker-compose.dev.yml logs -f db
docker-compose -f docker-compose.dev.yml logs -f redis
docker-compose -f docker-compose.dev.yml logs -f minio

# Reset environment (DELETES ALL DATA!)
make reset
```

## Common Issues

### Services won't start
```bash
# Check if Docker is running
docker info

# Check if ports are in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO

# Restart Docker Desktop if needed
```

### Database connection fails
```bash
# Check PostgreSQL status
docker-compose -f docker-compose.dev.yml ps db

# Check PostgreSQL logs
make db-logs

# Test connection
make test-db
```

### Seed data not loading
```bash
# Full reset (recreates database with seed data)
make reset
```

## Environment Variables

Key variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://postgres:dev_password_change_in_production@localhost:5432/berthcare_dev

# Redis
REDIS_URL=redis://:dev_redis_password@localhost:6379

# MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin123

# Auth0 (requires setup)
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id_here
AUTH0_CLIENT_SECRET=your_client_secret_here
```

## Useful SQL Queries

```sql
-- List all tables
\dt

-- Count records in all tables
SELECT 'organizations' AS table, COUNT(*) FROM organizations
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'clients', COUNT(*) FROM clients
UNION ALL SELECT 'visits', COUNT(*) FROM visits;

-- View active visits with details
SELECT * FROM active_visits_view;

-- View client summaries
SELECT * FROM client_summary_view;

-- Find visits for today
SELECT * FROM visits
WHERE scheduled_start::date = CURRENT_DATE;

-- Find users by role
SELECT * FROM users WHERE role = 'nurse';

-- View client medications
SELECT first_name, last_name, medications
FROM clients
WHERE status = 'active';
```

## Seed Data Reference

### Users (11 total)
- **Admin**: admin@caringhearts.ca
- **Supervisor**: supervisor@caringhearts.ca
- **Coordinator**: coordinator@caringhearts.ca
- **Nurses**: nurse1@caringhearts.ca, nurse2@caringhearts.ca
- **PSWs**: psw1@caringhearts.ca, psw2@caringhearts.ca, psw3@caringhearts.ca
- **Family**: john.smith@email.com, mary.jones@email.com, robert.brown@email.com

### Clients (5 total)
- Margaret Smith (CH-2024-001) - Alzheimer's
- Robert Johnson (CH-2024-002) - Parkinson's
- Dorothy Williams (CH-2024-003) - Diabetes, Hypertension
- James Brown (CH-2024-004) - Heart Failure
- Elizabeth Davis (CH-2024-005) - COPD, Osteoarthritis

### Organizations (2 total)
- Caring Hearts Home Care (Toronto)
- ComfortCare Services (Vancouver)

## Service Ports

| Service | Port(s) | Purpose |
|---------|---------|---------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| MinIO API | 9000 | S3 API |
| MinIO Console | 9001 | Web UI |
| Adminer | 8080 | DB UI |
| Redis Commander | 8081 | Redis UI |

## Make Commands Reference

```bash
make help          # Show all commands
make up            # Start services
make down          # Stop services
make restart       # Restart services
make status        # Show status
make logs          # View logs
make clean         # Stop and remove containers
make reset         # Full reset (with warning)

make db-shell      # PostgreSQL shell
make db-backup     # Backup database
make db-restore    # Restore database
make db-logs       # Database logs
make test-db       # Test database

make redis-shell   # Redis CLI
make redis-logs    # Redis logs
make test-redis    # Test Redis

make minio-logs    # MinIO logs
make test-minio    # Test MinIO

make test-all      # Test all services
make dev           # Start and show status
make rebuild       # Rebuild services
```

## Documentation Files

- `LOCAL_DEVELOPMENT.md` - Comprehensive guide
- `E3_COMPLETION_REPORT.md` - Task completion report
- `PROJECT_STRUCTURE.txt` - Project structure visualization
- `.env.example` - Environment variable template
- `QUICK_REFERENCE.md` - This file

## Getting Help

1. Check `LOCAL_DEVELOPMENT.md` for detailed documentation
2. Run `./scripts/verify-environment.sh` to diagnose issues
3. Check service logs with `make logs`
4. Try `make restart` to fix transient issues
5. Use `make reset` as last resort (deletes data)

## Next Steps After Setup

1. Update `.env` with your Auth0 credentials
2. Install Node.js dependencies: `npm install`
3. Start your application server
4. Access the database at `localhost:5432`
5. Use Adminer (http://localhost:8080) to explore data
6. Begin API development

---

**Remember**: `make help` shows all available commands!

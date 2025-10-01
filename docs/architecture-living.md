# BerthCare Living Architecture Document

## Document Overview

This is a **living document** that captures runtime configuration, operational procedures, deployment history, and dynamic aspects of the BerthCare system. Unlike the static architecture blueprint, this document is continuously updated to reflect the current state of deployed systems and operational knowledge.

**Last Updated**: 2025-09-30
**Document Owner**: DevOps Team
**Update Frequency**: Updated with each deployment and significant operational change

## Purpose and Scope

This document serves as the operational reference for:
- Current deployment configurations across environments
- Runtime system parameters and tuning
- Deployment history and change log
- Operational procedures and runbooks
- Performance metrics and system health indicators
- Incident response procedures
- Known issues and workarounds

## Current Deployment Status

### Environment Inventory

| Environment       | Status           | Last Deployed | Version | Infrastructure   |
|-------------------|------------------|---------------|---------|------------------|
| Local Development | Active           | N/A           | Latest  | Docker Compose   |
| Staging           | Not Yet Deployed | N/A           | N/A     | Planned: AWS ECS |
| Production        | Not Yet Deployed | N/A           | N/A     | Planned: AWS ECS |

### Active Services

#### Local Development Environment

**Status**: Fully Operational
**Configuration Date**: 2025-09-30

| Service         | Container Name            | Port(s)    | Health Status | Resource Usage           |
|-----------------|---------------------------|------------|---------------|--------------------------|
| PostgreSQL      | berthcare-postgres        | 5432       | Healthy       | CPU: <5%, Memory: ~200MB |
| Redis           | berthcare-redis           | 6379       | Healthy       | CPU: <2%, Memory: ~50MB  |
| MinIO           | berthcare-minio           | 9000, 9001 | Healthy       | CPU: <5%, Memory: ~100MB |
| Adminer         | berthcare-adminer         | 8080       | Running       | CPU: <2%, Memory: ~30MB  |
| Redis Commander | berthcare-redis-commander | 8081       | Running       | CPU: <2%, Memory: ~50MB  |

**Network**: berthcare-network (Bridge)
**Volumes**: postgres_data, redis_data, minio_data
**Total Resource Usage**: ~430MB RAM, <15% CPU (idle state)

## Runtime Configuration

### Database Configuration

#### PostgreSQL Settings

**Development Environment**:
```yaml
version: 14-alpine
max_connections: 100
shared_buffers: 128MB
effective_cache_size: 512MB
work_mem: 4MB
maintenance_work_mem: 64MB
```

**Connection Pool Configuration**:
```javascript
{
  min: 2,
  max: 10,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 600000
}
```

**Database Sizes** (Development):
- Schema: ~5MB
- Seed Data: ~2MB
- Indexes: ~1MB
- Total: ~8MB

**Active Indexes** (Development):
- Primary key indexes: 8
- Foreign key indexes: 12
- Custom performance indexes: 6
- Total indexes: 26

#### Redis Configuration

**Development Environment**:
```yaml
version: 7-alpine
maxmemory: 256mb
maxmemory-policy: allkeys-lru
appendonly: yes
appendfsync: everysec
```

**Cache TTL Settings**:
```javascript
{
  userSessions: 3600,        // 1 hour
  clientProfiles: 86400,     // 24 hours
  visitTemplates: 604800,    // 7 days
  carePlans: 43200          // 12 hours
}
```

**Current Cache Usage** (Development):
- Used Memory: <10MB
- Keys: ~0 (fresh instance)
- Evictions: 0

### File Storage Configuration

#### MinIO/S3 Storage

**Bucket Configuration**:
```yaml
berthcare-dev-photos:
  policy: download
  versioning: disabled
  lifecycle: none
  size: 0MB (empty)

berthcare-dev-documents:
  policy: download
  versioning: disabled
  lifecycle: none
  size: 0MB (empty)

berthcare-dev-signatures:
  policy: download
  versioning: disabled
  lifecycle: none
  size: 0MB (empty)
```

**Upload Limits**:
- Photos: 10MB max
- Documents: 25MB max
- Signatures: 5MB max

### Authentication Runtime Configuration

#### Auth0 Tenant Status

**Development Tenant**:
- **Status**: Not yet configured (requires Auth0 account setup)
- **Domain**: To be configured via environment variable
- **Applications**: To be created (Mobile App, Web Portal)
- **Rules**: To be implemented (role assignment, organization validation)

**Required Setup Steps**:
1. Create Auth0 account
2. Configure tenant for development
3. Create applications for mobile and web
4. Configure callback URLs and CORS
5. Implement custom rules for RBAC
6. Configure MFA policies

## Deployment Procedures

### Local Development Deployment

#### Initial Setup Procedure

```bash
# 1. Clone repository (when available)
git clone <repository-url>
cd Berthcare

# 2. Configure environment
cp .env.example .env
# Edit .env with required credentials

# 3. Start services
make up

# 4. Verify deployment
make test-all

# 5. Check service status
make status
```

**Expected Duration**: 5-10 minutes (including Docker image pulls)

#### Update Procedure

```bash
# 1. Pull latest changes
git pull origin develop

# 2. Rebuild containers (if needed)
make rebuild

# 3. Restart services
make restart

# 4. Verify health
make test-all
```

**Expected Duration**: 2-5 minutes

#### Rollback Procedure

```bash
# 1. Stop services
make down

# 2. Checkout previous version
git checkout <previous-commit>

# 3. Restart services
make up

# 4. Verify rollback
make status
```

**Expected Duration**: 3-5 minutes

### Staging Deployment (Planned)

**Status**: Not yet implemented

**Planned Procedure**:
1. Merge feature branch to `develop`
2. GitHub Actions builds Docker image
3. Push image to AWS ECR
4. Update ECS task definition
5. Deploy to staging cluster
6. Run smoke tests
7. Notify team of deployment

**Expected Duration**: 10-15 minutes

### Production Deployment (Planned)

**Status**: Not yet implemented

**Planned Procedure**:
1. Create release branch from `develop`
2. QA testing and approval
3. Merge release to `main`
4. GitHub Actions builds production image
5. Run database migrations
6. Deploy with blue-green strategy
7. Monitor for 24 hours
8. Promote to full traffic

**Expected Duration**: 30-45 minutes (excluding monitoring period)

## Monitoring and Observability

### Health Check Endpoints

#### Service Health Checks

**PostgreSQL**:
```bash
# Command
docker exec berthcare-postgres pg_isready -U postgres -d berthcare_dev

# Expected Response
/var/run/postgresql:5432 - accepting connections
```

**Redis**:
```bash
# Command
docker exec berthcare-redis redis-cli -a dev_redis_password ping

# Expected Response
PONG
```

**MinIO**:
```bash
# Command
curl http://localhost:9000/minio/health/live

# Expected Response
HTTP 200 OK
```

### Performance Metrics (Development)

**Current Baseline Metrics**:
- Database query time (avg): <10ms
- Redis cache hit rate: N/A (no traffic)
- File upload time (3MB): N/A (not tested)
- API response time: N/A (API not deployed)

**Resource Utilization**:
- Total Docker containers: 5
- Total memory usage: ~430MB
- Total CPU usage: <15% (idle)
- Disk usage: ~2GB (images + volumes)

### Logging Configuration

#### Log Locations

**PostgreSQL Logs**:
```bash
docker-compose -f docker-compose.dev.yml logs db
```

**Redis Logs**:
```bash
docker-compose -f docker-compose.dev.yml logs redis
```

**MinIO Logs**:
```bash
docker-compose -f docker-compose.dev.yml logs minio
```

**Log Retention**: 7 days (Docker default)

#### Log Levels

**Development Environment**:
- Application: DEBUG
- Database: LOG
- Redis: NOTICE
- MinIO: INFO

### Alerting Configuration (Planned)

**Alert Channels** (To be configured):
- Slack: #berthcare-alerts
- PagerDuty: DevOps on-call rotation
- Email: devops@berthcare.ca

**Alert Thresholds** (Planned):
- CPU > 80% for 5 minutes
- Memory > 85% for 5 minutes
- Disk usage > 80%
- Database connections > 80% of max
- Error rate > 1% for 5 minutes
- Response time p95 > 2 seconds

## Operational Runbooks

### Common Operational Tasks

#### Resetting Development Environment

**When to Use**: Database corruption, need fresh start, testing migrations

**Procedure**:
```bash
# DANGER: This deletes all data
make reset

# Alternative: Manual reset
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

**Expected Outcome**: Fresh environment with seed data loaded

#### Backing Up Development Database

**When to Use**: Before major schema changes, preserving test data

**Procedure**:
```bash
# Backup
make db-backup

# Verify backup file
ls -lh backup.sql

# Restore if needed
make db-restore
```

**Expected Outcome**: backup.sql file in repository root

#### Clearing Redis Cache

**When to Use**: Testing cache behavior, resolving stale data

**Procedure**:
```bash
# Access Redis CLI
make redis-shell

# Clear all keys
FLUSHALL

# Or clear specific database
SELECT 0
FLUSHDB

# Exit
EXIT
```

**Expected Outcome**: All cached data removed

#### Viewing Service Logs

**When to Use**: Debugging issues, monitoring activity

**Procedure**:
```bash
# All services
make logs

# Specific service
make db-logs
make redis-logs
make minio-logs

# Follow logs in real-time
docker-compose -f docker-compose.dev.yml logs -f db
```

**Expected Outcome**: Live log stream

#### Testing Service Connectivity

**When to Use**: After startup, troubleshooting connectivity

**Procedure**:
```bash
# Test all services
make test-all

# Test individually
make test-db
make test-redis
make test-minio
```

**Expected Outcome**: Success messages for all services

### Database Operations

#### Running SQL Queries

**Procedure**:
```bash
# Access PostgreSQL shell
make db-shell

# Run queries
SELECT * FROM users LIMIT 5;
SELECT * FROM clients WHERE status = 'active';

# Exit
\q
```

#### Viewing Database Statistics

**Procedure**:
```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('berthcare_dev'));

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

#### Checking for Slow Queries

**Procedure**:
```sql
-- Enable query logging (if not already enabled)
ALTER DATABASE berthcare_dev SET log_min_duration_statement = 100;

-- View slow queries (requires pg_stat_statements extension)
SELECT
  query,
  mean_time,
  calls
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;
```

### MinIO/S3 Operations

#### Uploading Test Files

**Via Console**:
1. Navigate to http://localhost:9001
2. Login with minioadmin/minioadmin123
3. Select bucket
4. Upload files via UI

**Via CLI**:
```bash
# Install MinIO client
brew install minio/stable/mc  # macOS
# or download from https://min.io/docs/minio/linux/reference/minio-mc.html

# Configure alias
mc alias set local http://localhost:9000 minioadmin minioadmin123

# Upload file
mc cp /path/to/file.jpg local/berthcare-dev-photos/

# List files
mc ls local/berthcare-dev-photos/
```

#### Clearing Bucket Contents

**Procedure**:
```bash
# Via MinIO client
mc rm --recursive --force local/berthcare-dev-photos/

# Or via console
# Navigate to bucket, select all, delete
```

## Incident Response

### Incident Classification

**Severity Levels**:
- **P1 (Critical)**: Service completely unavailable, data loss risk
- **P2 (High)**: Major functionality impaired, workaround available
- **P3 (Medium)**: Minor functionality issue, no immediate impact
- **P4 (Low)**: Cosmetic issue, documentation update needed

### Incident Response Procedures

#### P1 - Critical Incident

**Response Time**: Immediate (15 minutes)

**Procedure**:
1. Alert on-call engineer via PagerDuty
2. Create incident channel in Slack
3. Assess impact and scope
4. Implement immediate mitigation
5. Communicate status to stakeholders
6. Restore service
7. Conduct post-incident review

**Escalation Path**:
1. On-call DevOps Engineer
2. DevOps Team Lead
3. CTO

#### P2 - High Severity Incident

**Response Time**: 1 hour

**Procedure**:
1. Create incident ticket
2. Assign to appropriate team
3. Implement workaround if available
4. Develop permanent fix
5. Deploy fix to production
6. Monitor for recurrence

#### Service Recovery Procedures

**Database Failure**:
```bash
# Check database status
docker-compose -f docker-compose.dev.yml ps db

# View database logs
docker-compose -f docker-compose.dev.yml logs db

# Restart database
docker-compose -f docker-compose.dev.yml restart db

# If corruption suspected
make reset  # DANGER: Data loss
```

**Redis Failure**:
```bash
# Check Redis status
docker-compose -f docker-compose.dev.yml ps redis

# View Redis logs
docker-compose -f docker-compose.dev.yml logs redis

# Restart Redis
docker-compose -f docker-compose.dev.yml restart redis

# Clear corrupted data
docker exec berthcare-redis redis-cli -a dev_redis_password FLUSHALL
```

**Complete Environment Failure**:
```bash
# Stop all services
make down

# Remove corrupted volumes
docker volume rm berthcare-postgres-data berthcare-redis-data berthcare-minio-data

# Restart fresh
make up
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Services Won't Start

**Symptoms**:
- `docker-compose up` fails
- Containers exit immediately
- Port conflicts

**Diagnosis**:
```bash
# Check Docker status
docker ps -a

# Check for port conflicts
lsof -i :5432
lsof -i :6379
lsof -i :9000

# Check Docker logs
docker-compose -f docker-compose.dev.yml logs
```

**Solutions**:
1. Ensure Docker Desktop is running
2. Kill processes using required ports
3. Check .env file configuration
4. Verify Docker has sufficient resources (4GB+ RAM)

#### Issue: Database Connection Refused

**Symptoms**:
- Cannot connect to PostgreSQL
- "Connection refused" errors
- pg_isready fails

**Diagnosis**:
```bash
# Check PostgreSQL container
docker-compose -f docker-compose.dev.yml ps db

# Check PostgreSQL health
docker exec berthcare-postgres pg_isready -U postgres

# View PostgreSQL logs
docker-compose -f docker-compose.dev.yml logs db
```

**Solutions**:
1. Wait for health check to pass (up to 30 seconds)
2. Restart PostgreSQL container
3. Check credentials in .env file
4. Verify network connectivity

#### Issue: Redis Connection Issues

**Symptoms**:
- Cannot connect to Redis
- Authentication failures
- PING fails

**Diagnosis**:
```bash
# Check Redis container
docker-compose -f docker-compose.dev.yml ps redis

# Test Redis connection
docker exec berthcare-redis redis-cli -a dev_redis_password ping

# View Redis logs
docker-compose -f docker-compose.dev.yml logs redis
```

**Solutions**:
1. Verify password in .env matches docker-compose.dev.yml
2. Restart Redis container
3. Check network connectivity
4. Clear AOF file if corrupted

#### Issue: MinIO Not Accessible

**Symptoms**:
- Cannot access MinIO console
- Health check fails
- Buckets not created

**Diagnosis**:
```bash
# Check MinIO container
docker-compose -f docker-compose.dev.yml ps minio

# Test MinIO health
curl http://localhost:9000/minio/health/live

# Check bucket creation
docker-compose -f docker-compose.dev.yml logs minio-setup
```

**Solutions**:
1. Verify ports 9000 and 9001 are not in use
2. Check credentials match .env file
3. Restart MinIO container
4. Manually create buckets via console

#### Issue: Seed Data Not Loading

**Symptoms**:
- Empty database tables
- No test users or clients
- Login fails with test credentials

**Diagnosis**:
```bash
# Check if seed scripts exist
ls -la db/seeds/

# Check PostgreSQL initialization logs
docker-compose -f docker-compose.dev.yml logs db | grep "seed"

# Verify table counts
docker exec berthcare-postgres psql -U postgres -d berthcare_dev -c "SELECT COUNT(*) FROM users;"
```

**Solutions**:
1. Verify seed files have correct permissions
2. Check for SQL syntax errors in seed files
3. Reset environment to reload seeds: `make reset`
4. Manually run seed scripts

## Known Issues and Workarounds

### Development Environment

**Issue**: Docker Compose slow on macOS
**Impact**: Slow file I/O for volume mounts
**Workaround**: Use Docker Desktop with VirtioFS file sharing
**Status**: Permanent limitation of Docker on macOS
**Tracking**: N/A

**Issue**: Auth0 not configured
**Impact**: Cannot test authentication flows
**Workaround**: Configure Auth0 tenant and update .env
**Status**: Requires manual setup
**Tracking**: Setup documentation in .env.example

**Issue**: No API implementation yet
**Impact**: Cannot test full stack integration
**Workaround**: Wait for API development (Phase 4)
**Status**: Planned for future sprint
**Tracking**: E4 completion required

### CI/CD Pipeline

**Issue**: SonarQube and Snyk require external accounts
**Impact**: CI pipeline will fail without secrets
**Workaround**: Configure accounts and add secrets to GitHub
**Status**: Requires team decision
**Tracking**: GitHub secrets setup required

## Change Log

### 2025-09-30 - Initial Setup
- Created local development environment with Docker Compose
- Configured PostgreSQL, Redis, MinIO services
- Created database schema and seed data
- Set up Makefile for common operations
- Configured GitHub Actions CI pipeline
- Documented environment variables in .env.example

**Changes Made**:
- Added docker-compose.dev.yml
- Created db/seeds/01_schema.sql
- Created db/seeds/02_seed_data.sql
- Created Makefile with development commands
- Created .github/workflows/ci.yml
- Created .env.example with 94 variables

**Infrastructure Impact**: None (local development only)

## Future Enhancements

### Planned Infrastructure Improvements

**Q1 2026**:
- [ ] Deploy staging environment to AWS
- [ ] Configure AWS RDS and ElastiCache
- [ ] Implement Terraform infrastructure as code
- [ ] Set up production monitoring with New Relic
- [ ] Configure automated backups and disaster recovery

**Q2 2026**:
- [ ] Deploy production environment
- [ ] Implement blue-green deployment strategy
- [ ] Configure CloudFront CDN
- [ ] Set up multi-region replication
- [ ] Implement auto-scaling policies

**Q3 2026**:
- [ ] Add Kubernetes deployment option
- [ ] Implement service mesh (Istio)
- [ ] Enhanced observability with distributed tracing
- [ ] Implement chaos engineering practices

## Operational Metrics

### Service Level Objectives (SLOs)

**Development Environment** (Current):
- Availability: 95% (during working hours)
- Recovery Time: <10 minutes
- Data Loss: Acceptable (non-production)

**Staging Environment** (Planned):
- Availability: 99%
- Recovery Time: <30 minutes
- Data Loss: <1 hour (RPO)

**Production Environment** (Planned):
- Availability: 99.9%
- Recovery Time: <4 hours (RTO)
- Data Loss: <1 hour (RPO)
- Response Time p95: <2 seconds
- Error Rate: <0.1%

### Capacity Planning

**Current Capacity** (Development):
- Database: 8MB used / 100GB available
- Redis: 10MB used / 256MB available
- Storage: 0MB used / unlimited (local)

**Projected Growth** (6 months):
- Database: ~500MB (50 users, 1000 visits/month)
- Redis: ~100MB (session data + cache)
- Storage: ~10GB (photos and documents)

## Appendix

### Quick Reference Links

**Documentation**:
- Architecture Blueprint: `/project-documentation/architecture-output.md`
- Local Development Guide: `/LOCAL_DEVELOPMENT.md`
- GitHub Setup Guide: `/GITHUB-SETUP.md`
- Environment Variables: `/.env.example`

**Admin Tools**:
- PostgreSQL Admin: http://localhost:8080
- Redis Commander: http://localhost:8081
- MinIO Console: http://localhost:9001

**External Resources**:
- Auth0 Dashboard: https://manage.auth0.com/
- GitHub Repository: (Not yet configured)
- AWS Console: (Not yet configured)

### Contact Information

**Team Contacts**:
- DevOps Team: devops@berthcare.ca
- On-Call Engineer: PagerDuty rotation
- Technical Lead: TBD
- Security Team: security@berthcare.ca

**Support Channels**:
- Slack: #berthcare-dev
- Incident Response: #berthcare-incidents
- General Questions: #berthcare-help

---

**Document Maintenance**:
- This document should be updated with each deployment
- Review and update quarterly for accuracy
- Archive old versions in git history
- Keep change log current with all modifications

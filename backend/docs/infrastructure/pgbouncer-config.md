# PgBouncer Configuration Guide

## Overview

PgBouncer is a lightweight connection pooler for PostgreSQL that manages database connections efficiently. For the BerthCare application, PgBouncer is recommended for production deployments to handle connection pooling at the infrastructure level, providing better performance and resource utilization.

## Architecture Requirements

According to the BerthCare architecture specifications:
- **Primary Database:** PostgreSQL 14+
- **Connection Pooling:** PgBouncer for connection management
- **ACID Compliance:** Required for healthcare data integrity
- **Read Replicas:** Support for analytics and reporting queries
- **Backup Strategy:** Point-in-time recovery with 30-day retention

## Why PgBouncer?

### Benefits
1. **Connection Reuse:** Reduces overhead of creating new database connections
2. **Connection Limiting:** Prevents database overload from too many connections
3. **Lower Memory Usage:** PostgreSQL connections are memory-intensive; PgBouncer reduces this
4. **High Availability:** Supports failover and multiple database backends
5. **Zero Application Changes:** Transparent to application code

### Use Cases
- Production environments with multiple application instances
- Microservices architecture (BerthCare has 4+ services)
- High-traffic applications requiring many concurrent connections
- Cloud deployments with connection limits (AWS RDS, etc.)

## Installation

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install pgbouncer
```

### CentOS/RHEL
```bash
sudo yum install pgbouncer
```

### Docker
```dockerfile
FROM edoburu/pgbouncer:latest
```

## Configuration

### Basic Configuration File (`/etc/pgbouncer/pgbouncer.ini`)

```ini
[databases]
# Database connection string
# Format: dbname = host=hostname port=5432 dbname=database user=username password=password
berthcare = host=localhost port=5432 dbname=berthcare user=postgres password=secretpassword

# For read replicas (analytics/reporting)
berthcare_readonly = host=replica-host port=5432 dbname=berthcare user=readonly_user password=secretpassword

[pgbouncer]
# Listen on all interfaces (use specific IP in production)
listen_addr = 0.0.0.0
listen_port = 6432

# Authentication
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Connection pooling mode
# - session: Connection held until client disconnects (default)
# - transaction: Connection returned after each transaction (recommended for BerthCare)
# - statement: Connection returned after each statement (most aggressive)
pool_mode = transaction

# Connection limits
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3

# Timeouts (in seconds)
server_idle_timeout = 600
server_lifetime = 3600
server_connect_timeout = 15
query_timeout = 30
query_wait_timeout = 120
client_idle_timeout = 0

# Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1

# Admin console
admin_users = admin
stats_users = stats, admin

# Performance tuning
max_db_connections = 50
max_user_connections = 50

# Security
ignore_startup_parameters = extra_float_digits

# Server reset query (cleans up session state)
server_reset_query = DISCARD ALL
```

### User Authentication File (`/etc/pgbouncer/userlist.txt`)

```
"postgres" "md5<md5_hash_of_password>"
"berthcare_user" "md5<md5_hash_of_password>"
"readonly_user" "md5<md5_hash_of_password>"
"admin" "md5<md5_hash_of_password>"
```

Generate MD5 hash:
```bash
echo -n "passwordusername" | md5sum
# Example: echo -n "mypasswordpostgres" | md5sum
```

## BerthCare-Specific Configuration

### Pool Mode: Transaction
For BerthCare microservices, use `transaction` pool mode:
- Allows multiple microservices to share connections efficiently
- Returns connection to pool after each transaction
- Suitable for stateless REST APIs
- **Note:** Avoid prepared statements across transactions

### Connection Pool Sizing

**Formula:**
```
pool_size = (number_of_services × connections_per_service) + reserve
```

For BerthCare with 4 microservices:
```ini
# 4 services × 10 connections per service = 40 + 10 reserve
default_pool_size = 50
reserve_pool_size = 10
max_db_connections = 100
```

### Read Replica Configuration

For analytics and reporting queries:
```ini
[databases]
berthcare = host=primary-db port=5432 dbname=berthcare
berthcare_replica = host=replica-db port=5432 dbname=berthcare
```

Application code can connect to different endpoints:
- Write operations: `pgbouncer:6432/berthcare`
- Read operations: `pgbouncer:6432/berthcare_replica`

## Application Integration

### Connection String Format

**Without PgBouncer:**
```
postgresql://username:password@postgres-host:5432/berthcare
```

**With PgBouncer:**
```
postgresql://username:password@pgbouncer-host:6432/berthcare
```

### Environment Variables

Update `.env` file:
```bash
# Direct PostgreSQL connection (development)
DATABASE_URL=postgresql://postgres:password@localhost:5432/berthcare

# PgBouncer connection (production)
DATABASE_URL=postgresql://postgres:password@localhost:6432/berthcare
```

### BerthCare Backend Configuration

The BerthCare backend is already configured to work with PgBouncer:
- Connection pooling is handled by both application (pg.Pool) and PgBouncer
- Application pool should be smaller when using PgBouncer
- Recommended: Set `DATABASE_POOL_MAX=5` when using PgBouncer

## Monitoring and Administration

### Admin Console

Connect to PgBouncer admin console:
```bash
psql -h localhost -p 6432 -U admin pgbouncer
```

### Useful Commands

```sql
-- Show pool statistics
SHOW POOLS;

-- Show client connections
SHOW CLIENTS;

-- Show server connections
SHOW SERVERS;

-- Show configuration
SHOW CONFIG;

-- Show statistics
SHOW STATS;

-- Reload configuration
RELOAD;

-- Graceful shutdown
SHUTDOWN;

-- Pause all connections
PAUSE;

-- Resume all connections
RESUME;
```

### Monitoring Metrics

Key metrics to monitor:
1. **cl_active:** Active client connections
2. **cl_waiting:** Clients waiting for a connection
3. **sv_active:** Active server connections
4. **sv_idle:** Idle server connections
5. **sv_used:** Server connections used in the last second
6. **maxwait:** Maximum time a client waited for a connection

### Health Check Query

```sql
-- From PgBouncer admin console
SHOW POOLS;

-- Expected output should show:
-- - sv_active + sv_idle should be close to pool_size
-- - cl_waiting should be 0 or very low
-- - maxwait should be 0 or very low
```

## Production Deployment

### Docker Compose Example

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: berthcare
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secretpassword
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  pgbouncer:
    image: edoburu/pgbouncer:latest
    environment:
      DATABASE_URL: postgres://postgres:secretpassword@postgres:5432/berthcare
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 50
      MIN_POOL_SIZE: 10
      RESERVE_POOL_SIZE: 10
    ports:
      - "6432:6432"
    depends_on:
      - postgres

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgres://postgres:secretpassword@pgbouncer:6432/berthcare
      DATABASE_POOL_MAX: 5
    ports:
      - "3001:3001"
    depends_on:
      - pgbouncer

volumes:
  postgres_data:
```

### Kubernetes Deployment

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pgbouncer-config
data:
  pgbouncer.ini: |
    [databases]
    berthcare = host=postgres-service port=5432 dbname=berthcare

    [pgbouncer]
    listen_addr = 0.0.0.0
    listen_port = 6432
    pool_mode = transaction
    max_client_conn = 1000
    default_pool_size = 50

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pgbouncer
spec:
  replicas: 2
  selector:
    matchLabels:
      app: pgbouncer
  template:
    metadata:
      labels:
        app: pgbouncer
    spec:
      containers:
      - name: pgbouncer
        image: edoburu/pgbouncer:latest
        ports:
        - containerPort: 6432
        volumeMounts:
        - name: config
          mountPath: /etc/pgbouncer
      volumes:
      - name: config
        configMap:
          name: pgbouncer-config
```

## Security Best Practices

1. **Use MD5 or SCRAM-SHA-256 Authentication**
   ```ini
   auth_type = scram-sha-256
   ```

2. **Limit Listen Address**
   ```ini
   listen_addr = 10.0.0.0  # Internal network only
   ```

3. **Enable SSL/TLS**
   ```ini
   client_tls_sslmode = require
   client_tls_cert_file = /path/to/cert.pem
   client_tls_key_file = /path/to/key.pem
   ```

4. **Restrict Admin Access**
   ```ini
   admin_users = admin
   stats_users = monitoring
   ```

5. **Use Environment Variables for Secrets**
   - Don't hardcode passwords in configuration files
   - Use secrets management (Kubernetes Secrets, AWS Secrets Manager, etc.)

## Troubleshooting

### Common Issues

1. **"No more connections allowed"**
   - Increase `max_client_conn`
   - Check if `cl_waiting` is high in `SHOW POOLS`

2. **"server login failed"**
   - Verify userlist.txt has correct credentials
   - Check PostgreSQL pg_hba.conf allows PgBouncer host

3. **High Connection Wait Times**
   - Increase `default_pool_size`
   - Check if backend queries are slow

4. **"prepared statement X does not exist"**
   - Switch to `pool_mode = session` (less efficient)
   - Or modify application to not use prepared statements

### Logging

Enable detailed logging:
```ini
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
verbose = 1
```

Check logs:
```bash
tail -f /var/log/pgbouncer/pgbouncer.log
```

## Performance Tuning

### Operating System Limits

Increase file descriptor limits:
```bash
# /etc/security/limits.conf
pgbouncer soft nofile 10000
pgbouncer hard nofile 10000
```

### PostgreSQL Configuration

Adjust PostgreSQL for PgBouncer:
```sql
-- postgresql.conf
max_connections = 200  # Should be >= PgBouncer max_db_connections
shared_buffers = 4GB
effective_cache_size = 12GB
```

### Monitoring and Alerting

Set up alerts for:
- `cl_waiting > 10` (clients waiting for connections)
- `maxwait > 5000` (max wait time > 5 seconds)
- `sv_idle < 5` (running out of idle connections)

## References

- [PgBouncer Official Documentation](https://www.pgbouncer.org/)
- [PostgreSQL Connection Pooling](https://wiki.postgresql.org/wiki/Pgbouncer)
- [BerthCare Architecture Documentation](../project-documentation/architecture-output.md)

## Support

For BerthCare-specific questions:
- Review backend README.md
- Check application logs in `/var/log/berthcare/`
- Contact DevOps team for production issues

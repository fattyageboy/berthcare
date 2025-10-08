# Database Module

**Philosophy:** "Simplicity is the ultimate sophistication"

PostgreSQL connection management with connection pooling, read replica support, and migration framework.

## Features

- **Connection Pooling**: Efficient connection reuse (max 20 connections)
- **Read Replica Support**: Automatic query routing for scalability
- **Health Checks**: Monitor database connectivity and latency
- **Migration Framework**: Version-controlled schema changes with node-pg-migrate
- **Transaction Support**: Get dedicated clients for complex operations
- **Structured Logging**: All queries logged with timing and context

## Quick Start

### Initialize Database Connection

```typescript
import { initializeDatabase } from './database';

// Initialize with environment variables
const pool = initializeDatabase();

// Or with custom config
const pool = initializeDatabase({
  host: 'localhost',
  port: 5432,
  database: 'berthcare_dev',
  user: 'berthcare',
  password: 'password',
  max: 20,
});
```

### Execute Queries

```typescript
import { query, queryRead } from './database';

// Write operations (uses primary)
const result = await query(
  'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
  ['user@example.com', 'John Doe']
);

// Read operations (uses replica if available)
const users = await queryRead(
  'SELECT * FROM users WHERE active = $1',
  [true]
);
```

### Transactions

```typescript
import { getClient } from './database';

const client = await getClient();

try {
  await client.query('BEGIN');
  
  await client.query('INSERT INTO users (email) VALUES ($1)', ['user@example.com']);
  await client.query('INSERT INTO profiles (user_id) VALUES ($1)', [userId]);
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Health Checks

```typescript
import { checkHealth } from './database';

const health = await checkHealth();
// {
//   healthy: true,
//   latency: 5,
//   error: null
// }
```

## Configuration

### Environment Variables

```bash
# Primary Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=berthcare_dev
DATABASE_USER=berthcare
DATABASE_PASSWORD=password
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
DATABASE_CONNECTION_TIMEOUT=30000

# Alternative: Connection URL
DATABASE_URL=postgresql://user:password@host:port/database

# Read Replica (Optional)
DATABASE_READ_REPLICA_ENABLED=true
DATABASE_READ_REPLICA_HOST=replica.example.com
DATABASE_READ_REPLICA_PORT=5432
```

### Connection Pool Settings

- **Min Connections**: 2 (always ready)
- **Max Connections**: 20 (prevents overwhelming database)
- **Connection Timeout**: 30 seconds
- **Idle Timeout**: 10 seconds (automatic cleanup)

## Migrations

### Create a Migration

```bash
npm run migrate:create -- add-users-table
```

This creates a new migration file in `migrations/` directory.

### Write Migration

```javascript
exports.up = (pgm) => {
  pgm.createTable('users', {
    id: 'id', // Uses shorthand from init migration
    email: { type: 'varchar(255)', notNull: true, unique: true },
    name: { type: 'varchar(255)', notNull: true },
    created_at: 'created_at',
    updated_at: 'updated_at',
    deleted_at: 'deleted_at',
  });

  pgm.createIndex('users', 'email');
  
  // Add automatic updated_at trigger
  pgm.createTrigger('users', 'update_users_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users', { cascade: true });
};
```

### Run Migrations

```bash
# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Check migration status
npm run migrate:status

# Or use the helper script
./run-migrations.sh
```

## Read Replica Support

The module automatically routes queries to read replicas when configured:

- `query()` - Always uses primary (for writes)
- `queryRead()` - Uses replica if available, falls back to primary

### When to Use Read Replicas

- **High read volume**: Offload read traffic from primary
- **Reporting queries**: Run analytics without impacting writes
- **Geographic distribution**: Reduce latency for distant users

### Configuration

```bash
DATABASE_READ_REPLICA_ENABLED=true
DATABASE_READ_REPLICA_HOST=replica.example.com
DATABASE_READ_REPLICA_PORT=5432
```

The replica uses the same credentials and database name as the primary.

## Best Practices

### 1. Use Parameterized Queries

```typescript
// ✅ Good - prevents SQL injection
await query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ Bad - vulnerable to SQL injection
await query(`SELECT * FROM users WHERE email = '${email}'`);
```

### 2. Use Transactions for Multi-Step Operations

```typescript
// ✅ Good - atomic operation
const client = await getClient();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO orders ...');
  await client.query('UPDATE inventory ...');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### 3. Route Queries Appropriately

```typescript
// ✅ Good - uses replica for reads
const users = await queryRead('SELECT * FROM users');

// ✅ Good - uses primary for writes
await query('INSERT INTO users ...');

// ❌ Bad - uses primary for reads unnecessarily
const users = await query('SELECT * FROM users');
```

### 4. Handle Errors Gracefully

```typescript
try {
  const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  return result.rows[0];
} catch (error) {
  logger.error('Failed to fetch user', error);
  throw error;
}
```

### 5. Use Indexes Wisely

```javascript
// Add indexes for frequently queried columns
pgm.createIndex('users', 'email');
pgm.createIndex('visits', ['client_id', 'scheduled_start_time']);

// Add partial indexes for filtered queries
pgm.createIndex('users', 'email', {
  where: 'deleted_at IS NULL',
});
```

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Start PostgreSQL
```bash
docker-compose up -d postgres
```

### Too Many Connections

```
Error: sorry, too many clients already
```

**Solution**: Reduce `DATABASE_POOL_MAX` or increase PostgreSQL `max_connections`

### Migration Failed

```
Error: relation "users" already exists
```

**Solution**: Check migration status and rollback if needed
```bash
npm run migrate:status
npm run migrate:down
```

### Slow Queries

**Solution**: Check query execution plan
```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
```

Add indexes for frequently queried columns.

## Architecture Alignment

This module follows BerthCare's architecture principles:

- **Simplicity**: Clean API, intelligent defaults
- **Security**: Parameterized queries, connection pooling
- **Scalability**: Read replicas, connection limits
- **Observability**: Structured logging, health checks
- **Reliability**: Transaction support, error handling

## References

- [Architecture Documentation](../../../../docs/architecture.md)
- [node-pg-migrate Documentation](https://salsita.github.io/node-pg-migrate/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

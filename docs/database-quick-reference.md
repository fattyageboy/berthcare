# Database Quick Reference

Quick commands and examples for working with the BerthCare database.

## Quick Start

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
cd apps/backend
npm run migrate:up

# Verify connection
npm run dev
curl http://localhost:3000/health
```

## Migration Commands

```bash
# Create new migration
npm run migrate:create -- add-users-table

# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Use helper script (recommended)
./run-migrations.sh
```

## Common Queries

### Write Operations (Primary)

```typescript
import { query } from './database';

// Insert
await query(
  'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
  ['user@example.com', 'John Doe']
);

// Update
await query(
  'UPDATE users SET name = $1 WHERE id = $2',
  ['Jane Doe', userId]
);

// Delete (soft delete)
await query(
  'UPDATE users SET deleted_at = NOW() WHERE id = $1',
  [userId]
);
```

### Read Operations (Replica)

```typescript
import { queryRead } from './database';

// Select
const users = await queryRead(
  'SELECT * FROM users WHERE deleted_at IS NULL'
);

// Select with filter
const user = await queryRead(
  'SELECT * FROM users WHERE email = $1',
  ['user@example.com']
);
```

### Transactions

```typescript
import { getClient } from './database';

const client = await getClient();
try {
  await client.query('BEGIN');
  
  const userResult = await client.query(
    'INSERT INTO users (email) VALUES ($1) RETURNING id',
    ['user@example.com']
  );
  
  await client.query(
    'INSERT INTO profiles (user_id, bio) VALUES ($1, $2)',
    [userResult.rows[0].id, 'Bio text']
  );
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## Health Check

```typescript
import { checkHealth } from './database';

const health = await checkHealth();
// { healthy: true, latency: 2 }
```

## Environment Variables

```bash
# Primary Database
DATABASE_URL=postgresql://user:password@host:port/database

# Or individual settings
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=berthcare_dev
DATABASE_USER=berthcare
DATABASE_PASSWORD=password

# Connection Pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
DATABASE_CONNECTION_TIMEOUT=30000

# Read Replica (optional)
DATABASE_READ_REPLICA_ENABLED=true
DATABASE_READ_REPLICA_HOST=replica.example.com
DATABASE_READ_REPLICA_PORT=5432
```

## Migration Template

```javascript
// migrations/TIMESTAMP_description.js

exports.up = (pgm) => {
  // Create table
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    deleted_at: {
      type: 'timestamp',
    },
  });

  // Add index
  pgm.createIndex('users', 'email');

  // Add updated_at trigger
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

## Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Start PostgreSQL
docker-compose up -d postgres
```

### Migration Failed

```bash
# Check what migrations have run
psql $DATABASE_URL -c "SELECT * FROM pgmigrations;"

# Rollback if needed
npm run migrate:down
```

### Slow Queries

```sql
-- Check query plan
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';

-- Add index if needed
CREATE INDEX idx_users_email ON users(email);
```

### Too Many Connections

```bash
# Reduce pool size in .env
DATABASE_POOL_MAX=10

# Or increase PostgreSQL max_connections
# Edit postgresql.conf: max_connections = 200
```

## Best Practices

1. **Always use parameterized queries** - Prevents SQL injection
2. **Use transactions for multi-step operations** - Ensures data consistency
3. **Route queries appropriately** - Use `queryRead()` for reads
4. **Add indexes for frequently queried columns** - Improves performance
5. **Use soft deletes** - Preserves audit trail
6. **Test migrations in development first** - Prevents production issues

## References

- [Database Module README](../apps/backend/src/database/README.md)
- [Architecture Documentation](./architecture.md)
- [node-pg-migrate Docs](https://salsita.github.io/node-pg-migrate/)

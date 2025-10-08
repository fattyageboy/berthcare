# Redis Quick Reference

**Quick access guide for Redis cache operations in BerthCare**

## Quick Start

```bash
# Start Redis
docker-compose up redis

# Test connection
redis-cli -a berthcare_redis_password PING

# Run tests
npx tsx apps/backend/test-redis.js

# Check health
curl http://localhost:3000/health
```

## Common Operations

### Initialize
```typescript
import * as cache from './cache';
cache.initializeCache();
```

### Set/Get
```typescript
// String value
await cache.set('key', 'value', 3600);
const value = await cache.get('key');

// JSON object
await cache.set('user:123', { name: 'John' }, 3600);
const user = await cache.get('user:123', true);
```

### Delete
```typescript
// Single key
await cache.del('key');

// Multiple keys
await cache.del(['key1', 'key2', 'key3']);
```

### TTL
```typescript
// Set expiration
await cache.expire('key', 7200);

// Get remaining TTL
const ttl = await cache.ttl('key');
```

### Exists
```typescript
const exists = await cache.exists('key');
```

## Common Patterns

### Session Management
```typescript
const sessionId = `user-${userId}-session-${uuidv4()}`;
await cache.set(`session:${sessionId}`, sessionData, 604800); // 7 days
const session = await cache.get(`session:${sessionId}`, true);
```

### API Caching
```typescript
const cacheKey = `api:clients:list:${userId}`;
await cache.set(cacheKey, data, 300); // 5 minutes
const cached = await cache.get(cacheKey, true);
```

### Rate Limiting
```typescript
const key = `ratelimit:${ip}:${endpoint}`;
const redis = cache.getClient();
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 60);
if (count > 100) throw new Error('Rate limit exceeded');
```

### Presence Tracking
```typescript
await cache.set(`presence:${userId}`, Date.now(), 300);
const lastSeen = await cache.get(`presence:${userId}`);
```

## Key Naming

```
{prefix}:{entity}:{id}:{attribute}

Examples:
berthcare:session:user-123-session-456
berthcare:api:clients:list:user-123
berthcare:ratelimit:192.168.1.1:/api/v1/auth/login
berthcare:presence:user-123
```

## TTL Guidelines

| Use Case | TTL | Value |
|----------|-----|-------|
| Session tokens | 7 days | 604800 |
| API responses | 5 minutes | 300 |
| Rate limiting | 1 minute | 60 |
| Presence tracking | 5 minutes | 300 |
| Temporary data | 1 hour | 3600 |

## Environment Variables

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=berthcare_redis_password
REDIS_DB=0
REDIS_KEY_PREFIX=berthcare:
```

## Health Check

```typescript
const health = await cache.checkHealth();
// { healthy: true, latency: 3 }
```

## Troubleshooting

### Connection Refused
```bash
# Check if Redis is running
docker-compose ps redis

# Start Redis
docker-compose up redis
```

### Authentication Failed
```bash
# Verify password in .env
REDIS_PASSWORD=berthcare_redis_password
```

### Memory Issues
```bash
# Check memory usage
redis-cli -a berthcare_redis_password INFO memory

# Clear all keys (development only!)
redis-cli -a berthcare_redis_password FLUSHDB
```

## CLI Commands

```bash
# Connect to Redis
redis-cli -a berthcare_redis_password

# Get all keys
KEYS berthcare:*

# Get key value
GET berthcare:session:user-123

# Get key TTL
TTL berthcare:session:user-123

# Delete key
DEL berthcare:session:user-123

# Check memory
INFO memory

# Monitor commands
MONITOR
```

## Documentation

- [Cache Module README](../apps/backend/src/cache/README.md)
- [Architecture Documentation](./architecture.md)
- [B3 Completion Summary](./B3-completion-summary.md)
- [ioredis Documentation](https://github.com/redis/ioredis)

## Support

For issues or questions:
1. Check [Cache Module README](../apps/backend/src/cache/README.md)
2. Review [B3 Completion Summary](./B3-completion-summary.md)
3. Run test suite: `npx tsx apps/backend/test-redis.js`
4. Check health endpoint: `curl http://localhost:3000/health`

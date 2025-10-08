# Redis Cache Module

**Philosophy:** "Simplicity is the ultimate sophistication"

High-performance caching layer using Redis 7 with ioredis client. Provides session management, API response caching, rate limiting, and real-time pub/sub capabilities.

## Features

- ✅ **Connection Management**: Automatic connection with retry logic
- ✅ **Exponential Backoff**: Intelligent retry strategy (50ms → 2000ms max)
- ✅ **Health Checks**: Built-in health monitoring with latency tracking
- ✅ **Session Management**: JWT refresh token storage with TTL
- ✅ **API Caching**: Response caching with automatic expiration
- ✅ **Rate Limiting**: Request throttling per IP/endpoint
- ✅ **JSON Support**: Automatic serialization/deserialization
- ✅ **Graceful Shutdown**: Clean connection closure

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Backend API (Node.js/Express)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Cache Module (ioredis)                              │   │
│  │  - Connection pooling                                │   │
│  │  - Retry logic (exponential backoff)                 │   │
│  │  - Health monitoring                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Redis 7 (Docker / ElastiCache)                             │
│  - Port: 6379                                               │
│  - Password protected                                       │
│  - AOF persistence                                          │
│  - Sub-millisecond latency                                  │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=berthcare_redis_password
REDIS_DB=0
REDIS_KEY_PREFIX=berthcare:

# Connection behavior
REDIS_MAX_RETRIES_PER_REQUEST=3
REDIS_RETRY_STRATEGY=exponential  # 50ms → 2000ms
```

### Connection String (Alternative)

```bash
REDIS_URL=redis://:berthcare_redis_password@localhost:6379/0
```

## Usage

### Initialize Connection

```typescript
import { initializeCache } from './cache';

// Initialize with defaults from environment
const redis = initializeCache();

// Or with custom config
const redis = initializeCache({
  host: 'redis.example.com',
  port: 6379,
  password: 'secret',
  db: 0,
  keyPrefix: 'myapp:',
});
```

### Basic Operations

```typescript
import * as cache from './cache';

// Set a value with TTL
await cache.set('user:123', 'John Doe', 3600); // 1 hour

// Get a value
const name = await cache.get('user:123');

// Delete a value
await cache.del('user:123');

// Check if key exists
const exists = await cache.exists('user:123');

// Set expiration
await cache.expire('user:123', 7200); // 2 hours

// Get remaining TTL
const ttl = await cache.ttl('user:123');
```

### JSON Operations

```typescript
// Store objects
const user = { id: 123, name: 'John Doe', role: 'nurse' };
await cache.set('user:123', user, 3600);

// Retrieve objects
const retrievedUser = await cache.get('user:123', true); // parseJson = true
console.log(retrievedUser.name); // 'John Doe'
```

### Session Management Pattern

```typescript
// Store session with refresh token
const sessionId = `user-${userId}-session-${uuidv4()}`;
const sessionData = {
  userId,
  email: user.email,
  role: user.role,
  refreshToken: generateRefreshToken(),
};

await cache.set(`session:${sessionId}`, sessionData, 604800); // 7 days

// Retrieve session
const session = await cache.get(`session:${sessionId}`, true);

// Invalidate session
await cache.del(`session:${sessionId}`);
```

### API Response Caching Pattern

```typescript
// Cache API response
const cacheKey = `api:clients:list:${userId}`;
const clients = await fetchClientsFromDatabase(userId);
await cache.set(cacheKey, clients, 300); // 5 minutes

// Retrieve cached response
const cachedClients = await cache.get(cacheKey, true);

// Invalidate cache on data change
await cache.del(cacheKey);
```

### Rate Limiting Pattern

```typescript
import { getClient } from './cache';

const rateLimitKey = `ratelimit:${ip}:${endpoint}`;
const redis = getClient();

// Increment request count
const count = await redis.incr(rateLimitKey);

// Set expiration on first request
if (count === 1) {
  await redis.expire(rateLimitKey, 60); // 1 minute window
}

// Check if rate limit exceeded
if (count > 100) {
  throw new Error('Rate limit exceeded');
}
```

### Presence Tracking Pattern

```typescript
// Update user presence
await cache.set(`presence:${userId}`, Date.now(), 300); // 5 minutes

// Check if user is online
const lastSeen = await cache.get(`presence:${userId}`);
const isOnline = lastSeen && (Date.now() - parseInt(lastSeen)) < 300000;
```

### Pub/Sub Pattern (Real-time)

```typescript
import { getClient } from './cache';

const redis = getClient();

// Subscribe to channel
redis.subscribe('alerts', (err, count) => {
  console.log(`Subscribed to ${count} channel(s)`);
});

// Handle messages
redis.on('message', (channel, message) => {
  console.log(`Received from ${channel}:`, message);
});

// Publish message
await redis.publish('alerts', JSON.stringify({
  type: 'care_coordination',
  message: 'Urgent: Client needs assistance',
}));
```

## Health Monitoring

### Health Check

```typescript
import { checkHealth } from './cache';

const health = await checkHealth();
console.log(health);
// {
//   healthy: true,
//   latency: 3,
// }
```

### Health Endpoint

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "checks": {
    "cache": {
      "healthy": true,
      "latency": 3
    }
  }
}
```

## Retry Logic

The module implements exponential backoff retry strategy:

```
Attempt 1: 50ms delay
Attempt 2: 100ms delay
Attempt 3: 150ms delay
...
Max delay: 2000ms
```

Connection events are logged:
- `connect` - Initial connection established
- `ready` - Client ready to accept commands
- `error` - Connection error occurred
- `close` - Connection closed
- `reconnecting` - Attempting to reconnect

## Key Patterns

### Key Naming Convention

```
{prefix}:{entity}:{id}:{attribute}

Examples:
berthcare:session:user-123-session-456
berthcare:api:clients:list:user-123
berthcare:ratelimit:192.168.1.1:/api/v1/auth/login
berthcare:presence:user-123
```

### TTL Guidelines

| Use Case | TTL | Reason |
|----------|-----|--------|
| Session tokens | 7 days | Refresh token lifetime |
| API responses | 5 minutes | Balance freshness vs performance |
| Rate limiting | 1 minute | Short window for abuse prevention |
| Presence tracking | 5 minutes | Recent activity indicator |
| Temporary data | 1 hour | Short-lived cache |

## Production Considerations

### ElastiCache Configuration

```hcl
# terraform/modules/cache/main.tf
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "berthcare-redis"
  replication_group_description = "BerthCare Redis cluster"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = "cache.t4g.micro"
  num_cache_clusters         = 2  # Primary + replica
  parameter_group_name       = "default.redis7"
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  automatic_failover_enabled = true
  multi_az_enabled          = true
}
```

### Monitoring

CloudWatch metrics to monitor:
- `CacheHits` / `CacheMisses` - Cache effectiveness
- `CPUUtilization` - Resource usage
- `NetworkBytesIn` / `NetworkBytesOut` - Traffic
- `CurrConnections` - Active connections
- `Evictions` - Memory pressure indicator

### Security

- ✅ Password authentication enabled
- ✅ Encryption at rest (ElastiCache)
- ✅ Encryption in transit (TLS)
- ✅ VPC security groups (production)
- ✅ No public access

## Testing

Run comprehensive tests:

```bash
npm run test:redis
# or
node apps/backend/test-redis.js
```

Tests cover:
- Connection initialization
- Health checks
- Set/Get operations
- JSON serialization
- TTL management
- Exists checks
- Delete operations
- Session management
- Rate limiting
- Cache invalidation

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:** Ensure Redis is running
```bash
docker-compose up redis
```

### Authentication Failed

```
Error: NOAUTH Authentication required
```

**Solution:** Check password in `.env`
```bash
REDIS_PASSWORD=berthcare_redis_password
```

### Memory Issues

```
Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solution:** Increase Redis memory or implement eviction policy
```bash
# In redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

## Performance Tips

1. **Use pipelining for bulk operations**
   ```typescript
   const pipeline = redis.pipeline();
   pipeline.set('key1', 'value1');
   pipeline.set('key2', 'value2');
   await pipeline.exec();
   ```

2. **Set appropriate TTLs** - Don't cache forever
3. **Use key prefixes** - Organize keys logically
4. **Monitor cache hit rate** - Aim for >80%
5. **Implement cache warming** - Pre-populate frequently accessed data

## References

- [ioredis Documentation](https://github.com/redis/ioredis)
- [Redis Commands](https://redis.io/commands)
- [AWS ElastiCache Best Practices](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/BestPractices.html)
- [Architecture Documentation](../../../docs/architecture.md)

## Task Completion

**Task B3: Configure Redis connection** ✅

- ✅ Set up Redis client using ioredis
- ✅ Implement connection retry logic (exponential backoff)
- ✅ Create Redis health check
- ✅ Configure for session management and caching
- ✅ Comprehensive testing
- ✅ Production-ready implementation

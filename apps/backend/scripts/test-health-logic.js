#!/usr/bin/env node
/**
 * Test health check logic without starting the server
 * This verifies that database and Redis connections work
 */

const { Pool } = require('pg');
const Redis = require('ioredis');

async function testDatabaseHealth() {
  const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'berthcare_dev',
    user: process.env.DATABASE_USER || 'berthcare',
    password: process.env.DATABASE_PASSWORD || 'berthcare_local_dev_password',
    ssl: false,
  });

  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    const latency = Date.now() - start;
    await pool.end();
    return { healthy: true, latency };
  } catch (error) {
    await pool.end();
    return { healthy: false, error: error.message };
  }
}

async function testRedisHealth() {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || 'berthcare_redis_password',
    lazyConnect: true,
  });

  const start = Date.now();
  try {
    await redis.connect();
    await redis.ping();
    const latency = Date.now() - start;
    await redis.quit();
    return { healthy: true, latency };
  } catch (error) {
    await redis.quit();
    return { healthy: false, error: error.message };
  }
}

async function runHealthCheck() {
  console.log('🏥 Testing BerthCare Backend Health Check Logic');
  console.log('================================================\n');

  // Test Database
  console.log('1. Testing PostgreSQL connection...');
  const dbHealth = await testDatabaseHealth();
  if (dbHealth.healthy) {
    console.log(`✅ PostgreSQL: healthy (latency: ${dbHealth.latency}ms)`);
  } else {
    console.log(`❌ PostgreSQL: unhealthy (${dbHealth.error})`);
  }

  // Test Redis
  console.log('\n2. Testing Redis connection...');
  const cacheHealth = await testRedisHealth();
  if (cacheHealth.healthy) {
    console.log(`✅ Redis: healthy (latency: ${cacheHealth.latency}ms)`);
  } else {
    console.log(`❌ Redis: unhealthy (${cacheHealth.error})`);
  }

  // Overall status
  console.log('\n================================================');
  const allHealthy = dbHealth.healthy && cacheHealth.healthy;
  const status = allHealthy ? 'healthy' : 'degraded';

  console.log(`\nOverall Status: ${status.toUpperCase()}`);

  // Simulate health endpoint response
  const healthResponse = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      heapUsed: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024),
      rss: Math.floor(process.memoryUsage().rss / 1024 / 1024),
    },
    checks: {
      database: {
        healthy: dbHealth.healthy,
        latency: dbHealth.latency || 0,
        error: dbHealth.error || null,
      },
      cache: {
        healthy: cacheHealth.healthy,
        latency: cacheHealth.latency || 0,
        error: cacheHealth.error || null,
      },
    },
    version: '1.0.0',
  };

  console.log('\nHealth Endpoint Response:');
  console.log(JSON.stringify(healthResponse, null, 2));
  console.log('\n✅ Health check logic verified!');
  console.log('\nTo test the actual endpoint, start the server with:');
  console.log('  npm run dev');
  console.log('\nThen run:');
  console.log('  curl http://localhost:3000/health');

  process.exit(allHealthy ? 0 : 1);
}

// Load environment variables
require('dotenv').config({ path: '../../.env' });

// Run the health check
runHealthCheck().catch((error) => {
  console.error('❌ Health check failed:', error);
  process.exit(1);
});

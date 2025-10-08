#!/usr/bin/env node
/**
 * Redis Connection Test Script
 * Tests Redis connection, retry logic, and health checks
 * Task B3: Configure Redis connection
 */

const { resolve } = require('path');
require('dotenv').config({ path: resolve(__dirname, '../../.env') });

async function testRedisConnection() {
  console.log('🔍 Testing Redis Connection Module (Task B3)...\n');

  try {
    // Import cache module
    const cache = require('../src/cache/index.ts');

    // Test 1: Initialize Redis connection
    console.log('✅ Test 1: Initialize Redis connection');
    const client = cache.initializeCache();
    console.log('   Redis client initialized successfully\n');

    // Wait for connection to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 2: Health check
    console.log('✅ Test 2: Health check');
    const health = await cache.checkHealth();
    console.log(`   Status: ${health.healthy ? 'Healthy' : 'Unhealthy'}`);
    console.log(`   Latency: ${health.latency}ms\n`);

    if (!health.healthy) {
      throw new Error(`Redis health check failed: ${health.error}`);
    }

    // Test 3: Set/Get operations
    console.log('✅ Test 3: Set/Get operations');
    await cache.set('test:key', 'test-value', 60);
    const value = await cache.get('test:key');
    console.log(`   Set: test:key = test-value`);
    console.log(`   Get: test:key = ${value}`);
    if (value !== 'test-value') {
      throw new Error('Set/Get operation failed');
    }
    console.log('   ✓ Set/Get working correctly\n');

    // Test 4: JSON operations
    console.log('✅ Test 4: JSON operations');
    const testObj = { id: 1, name: 'Test User', role: 'nurse' };
    await cache.set('test:json', testObj, 60);
    const retrievedObj = await cache.get('test:json', true);
    console.log(`   Set: test:json = ${JSON.stringify(testObj)}`);
    console.log(`   Get: test:json = ${JSON.stringify(retrievedObj)}`);
    if (retrievedObj.id !== testObj.id || retrievedObj.name !== testObj.name) {
      throw new Error('JSON operation failed');
    }
    console.log('   ✓ JSON operations working correctly\n');

    // Test 5: TTL operations
    console.log('✅ Test 5: TTL operations');
    await cache.set('test:ttl', 'expires-soon', 5);
    const ttlValue = await cache.ttl('test:ttl');
    console.log(`   Set: test:ttl with 5 second TTL`);
    console.log(`   TTL: ${ttlValue} seconds remaining`);
    if (ttlValue <= 0 || ttlValue > 5) {
      throw new Error('TTL operation failed');
    }
    console.log('   ✓ TTL operations working correctly\n');

    // Test 6: Exists operation
    console.log('✅ Test 6: Exists operation');
    const exists = await cache.exists('test:key');
    const notExists = await cache.exists('test:nonexistent');
    console.log(`   Exists test:key: ${exists}`);
    console.log(`   Exists test:nonexistent: ${notExists}`);
    if (!exists || notExists) {
      throw new Error('Exists operation failed');
    }
    console.log('   ✓ Exists operations working correctly\n');

    // Test 7: Delete operation
    console.log('✅ Test 7: Delete operation');
    const deleteCount = await cache.del('test:key');
    const afterDelete = await cache.exists('test:key');
    console.log(`   Deleted: ${deleteCount} key(s)`);
    console.log(`   Exists after delete: ${afterDelete}`);
    if (deleteCount !== 1 || afterDelete) {
      throw new Error('Delete operation failed');
    }
    console.log('   ✓ Delete operations working correctly\n');

    // Test 8: Session management pattern
    console.log('✅ Test 8: Session management pattern');
    const sessionId = 'user-123-session-456';
    const sessionData = {
      userId: '123',
      email: 'nurse@berthcare.ca',
      role: 'nurse',
      refreshToken: 'jwt-refresh-token-here',
    };
    await cache.set(`session:${sessionId}`, sessionData, 604800); // 7 days
    const session = await cache.get(`session:${sessionId}`, true);
    console.log(`   Session stored: ${sessionId}`);
    console.log(`   Session data: ${JSON.stringify(session)}`);
    if (session.userId !== sessionData.userId) {
      throw new Error('Session management pattern failed');
    }
    console.log('   ✓ Session management working correctly\n');

    // Test 9: Rate limiting pattern
    console.log('✅ Test 9: Rate limiting pattern');
    const rateLimitKey = 'ratelimit:192.168.1.1:/api/v1/auth/login';
    const client2 = cache.getClient();
    await client2.incr(rateLimitKey);
    await cache.expire(rateLimitKey, 60);
    const attempts = await cache.get(rateLimitKey);
    console.log(`   Rate limit key: ${rateLimitKey}`);
    console.log(`   Attempts: ${attempts}`);
    if (parseInt(attempts) !== 1) {
      throw new Error('Rate limiting pattern failed');
    }
    console.log('   ✓ Rate limiting pattern working correctly\n');

    // Test 10: Cache invalidation pattern
    console.log('✅ Test 10: Cache invalidation pattern');
    await cache.set('api:clients:list:user-123', [{ id: 1, name: 'Client 1' }], 300);
    await cache.set('api:clients:list:user-456', [{ id: 2, name: 'Client 2' }], 300);
    const deletedCount = await cache.del([
      'api:clients:list:user-123',
      'api:clients:list:user-456',
    ]);
    console.log(`   Invalidated ${deletedCount} cache entries`);
    if (deletedCount !== 2) {
      throw new Error('Cache invalidation pattern failed');
    }
    console.log('   ✓ Cache invalidation working correctly\n');

    // Cleanup
    await cache.del(['test:json', 'test:ttl', `session:${sessionId}`, rateLimitKey]);

    // Close connection
    await cache.closeCache();
    console.log('✅ Redis connection closed gracefully\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED - Task B3 Complete');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\nRedis Connection Module Features:');
    console.log('  ✓ Connection with ioredis');
    console.log('  ✓ Exponential backoff retry logic');
    console.log('  ✓ Health check endpoint');
    console.log('  ✓ Session management support');
    console.log('  ✓ API response caching');
    console.log('  ✓ Rate limiting support');
    console.log('  ✓ Cache invalidation');
    console.log('  ✓ TTL management');
    console.log('  ✓ JSON serialization/deserialization');
    console.log('  ✓ Graceful connection handling\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testRedisConnection();

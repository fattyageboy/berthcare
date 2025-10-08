#!/usr/bin/env node

/**
 * S3 Storage Module Test
 *
 * Tests S3 connectivity and core functionality
 * Run: node test-s3.js
 */

require('dotenv').config();

// Import storage functions
const {
  generatePhotoUploadUrl,
  generateSignatureUploadUrl,
  generateDownloadUrl,
  fileExists,
  getFileMetadata,
  generateBatchPhotoUploadUrls,
  healthCheck,
  generateS3Key,
  StoragePaths,
} = require('../src/storage/index.ts');

// Test configuration
const TEST_USER_ID = 'test-user-123';
const TEST_VISIT_ID = 'test-visit-456';
const TEST_CLIENT_ID = 'test-client-789';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.cyan}▶ Testing: ${name}${colors.reset}`);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`  ℹ ${message}`, 'blue');
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║         BerthCare S3 Storage Module Tests             ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  logTest('S3 Health Check');
  try {
    const health = await healthCheck();
    if (health.healthy) {
      logSuccess(`S3 connection successful (${health.latency}ms)`);
      logInfo(`Bucket: ${process.env.AWS_S3_BUCKET}`);
      logInfo(`Region: ${process.env.AWS_REGION}`);
      passed++;
    } else {
      logError(`Health check failed: ${health.message}`);
      failed++;
    }
  } catch (error) {
    logError(`Health check error: ${error.message}`);
    failed++;
  }

  // Test 2: Generate S3 Key
  logTest('Generate S3 Key');
  try {
    const key = generateS3Key(StoragePaths.PHOTOS, TEST_USER_ID, 'jpg');
    if (key.startsWith(`${StoragePaths.PHOTOS}/${TEST_USER_ID}/`)) {
      logSuccess(`Generated key: ${key}`);
      passed++;
    } else {
      logError(`Invalid key format: ${key}`);
      failed++;
    }
  } catch (error) {
    logError(`Key generation error: ${error.message}`);
    failed++;
  }

  // Test 3: Generate Photo Upload URL
  logTest('Generate Photo Upload URL');
  try {
    const result = await generatePhotoUploadUrl(TEST_USER_ID, {
      mimeType: 'image/jpeg',
      size: 2048576,
      compressed: true,
      compressionQuality: 85,
      visitId: TEST_VISIT_ID,
      clientId: TEST_CLIENT_ID,
    });

    if (result.url && result.key && result.expiresIn) {
      logSuccess('Generated pre-signed upload URL');
      logInfo(`Key: ${result.key}`);
      logInfo(`Expires in: ${result.expiresIn} seconds`);
      logInfo(`URL length: ${result.url.length} characters`);
      passed++;
    } else {
      logError('Missing required fields in response');
      failed++;
    }
  } catch (error) {
    logError(`Upload URL generation error: ${error.message}`);
    failed++;
  }

  // Test 4: Generate Signature Upload URL
  logTest('Generate Signature Upload URL');
  try {
    const result = await generateSignatureUploadUrl(TEST_USER_ID, TEST_VISIT_ID);

    if (result.url && result.key && result.expiresIn) {
      logSuccess('Generated signature upload URL');
      logInfo(`Key: ${result.key}`);
      passed++;
    } else {
      logError('Missing required fields in response');
      failed++;
    }
  } catch (error) {
    logError(`Signature URL generation error: ${error.message}`);
    failed++;
  }

  // Test 5: Batch Upload URLs
  logTest('Generate Batch Upload URLs');
  try {
    const count = 3;
    const results = await generateBatchPhotoUploadUrls(TEST_USER_ID, count, {
      mimeType: 'image/jpeg',
      visitId: TEST_VISIT_ID,
    });

    if (results.length === count) {
      logSuccess(`Generated ${count} upload URLs`);
      results.forEach((result, index) => {
        logInfo(`URL ${index + 1}: ${result.key}`);
      });
      passed++;
    } else {
      logError(`Expected ${count} URLs, got ${results.length}`);
      failed++;
    }
  } catch (error) {
    logError(`Batch URL generation error: ${error.message}`);
    failed++;
  }

  // Test 6: File Exists Check (should not exist)
  logTest('Check Non-Existent File');
  try {
    const testKey = 'photos/test-user/non-existent-file.jpg';
    const exists = await fileExists(testKey);

    if (!exists) {
      logSuccess('Correctly identified non-existent file');
      passed++;
    } else {
      logError('File should not exist');
      failed++;
    }
  } catch (error) {
    logError(`File exists check error: ${error.message}`);
    failed++;
  }

  // Test 7: Get Metadata for Non-Existent File
  logTest('Get Metadata for Non-Existent File');
  try {
    const testKey = 'photos/test-user/non-existent-file.jpg';
    const metadata = await getFileMetadata(testKey);

    if (metadata === null) {
      logSuccess('Correctly returned null for non-existent file');
      passed++;
    } else {
      logError('Should return null for non-existent file');
      failed++;
    }
  } catch (error) {
    logError(`Metadata retrieval error: ${error.message}`);
    failed++;
  }

  // Test 8: Generate Download URL
  logTest('Generate Download URL');
  try {
    const testKey = 'photos/test-user/test-file.jpg';
    const downloadUrl = await generateDownloadUrl(testKey, 3600);

    if (downloadUrl && downloadUrl.includes(testKey)) {
      logSuccess('Generated download URL');
      logInfo(`URL includes key: ${testKey}`);
      passed++;
    } else {
      logError('Invalid download URL');
      failed++;
    }
  } catch (error) {
    logError(`Download URL generation error: ${error.message}`);
    failed++;
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    Test Summary                        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  log(`\nTotal Tests: ${passed + failed}`);
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

  if (failed === 0) {
    log('\n✓ All tests passed!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Test actual file upload using the generated pre-signed URL');
    log('2. Configure S3 lifecycle policies for archival');
    log('3. Integrate with visit documentation endpoints');
    process.exit(0);
  } else {
    log('\n✗ Some tests failed', 'red');
    log('\nTroubleshooting:', 'yellow');
    log('1. Check AWS credentials in .env file');
    log('2. Verify S3 bucket exists and is accessible');
    log("3. For LocalStack: ensure it's running on port 4566");
    log('4. Check IAM permissions for S3 operations');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  logError(`\nFatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

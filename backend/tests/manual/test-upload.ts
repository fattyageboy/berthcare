/**
 * Test script for photo upload functionality
 * Run with: ts-node tests/manual/test-upload.ts
 */

import { s3Service } from '../../src/services/file-upload/s3.service';
import { buckets } from '../../src/config/s3';

async function testS3Connection() {
  console.log('Testing S3/MinIO connection...');

  try {
    const testContent = Buffer.from('Test photo content');
    const testKey = `test/test-${Date.now()}.txt`;

    console.log('Uploading test file...');
    const uploadResult = await s3Service.uploadFile(
      testContent,
      testKey,
      'text/plain',
      buckets.photos
    );

    console.log('✓ Upload successful:', uploadResult);

    console.log('Checking if file exists...');
    const exists = await s3Service.fileExists(buckets.photos, testKey);
    console.log('✓ File exists:', exists);

    console.log('Cleaning up test file...');
    await s3Service.deleteFile(buckets.photos, testKey);
    console.log('✓ Test file deleted');

    console.log('\n✅ All S3/MinIO tests passed!');
  } catch (error) {
    console.error('\n❌ S3/MinIO test failed:', error);
    process.exit(1);
  }
}

testS3Connection()
  .then(() => {
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });

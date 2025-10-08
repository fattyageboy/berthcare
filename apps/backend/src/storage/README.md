# S3 Storage Module

**Philosophy:** "The best interface is no interface" - Make file storage invisible to users.

## Overview

This module provides a simple, reliable interface for storing and retrieving files in AWS S3. It's designed to support the offline-first architecture by enabling direct client-to-S3 uploads via pre-signed URLs.

## Design Principles

1. **Direct Upload Pattern**: Clients upload directly to S3 using pre-signed URLs, reducing server load
2. **Metadata-Rich**: Store compression info, visit context, and audit trails with each file
3. **Canadian Data Residency**: All data stored in `ca-central-1` region for PIPEDA compliance
4. **Lifecycle Management**: Automatic archival after 7 years (configured via S3 lifecycle policies)
5. **Security First**: Pre-signed URLs expire quickly (15 minutes default), preventing abuse

## Architecture

```
Mobile App                    Backend API                    AWS S3
    |                              |                            |
    |--1. Request upload URL------>|                            |
    |                              |--2. Generate pre-signed--->|
    |<----3. Return URL------------|                            |
    |                                                           |
    |--4. Upload file directly (with metadata)----------------->|
    |                                                           |
    |--5. Confirm upload---------->|                            |
    |                              |--6. Verify file exists---->|
```

**Why this pattern?**
- Server never handles file data (reduces load, improves speed)
- Client uploads directly to S3 (faster, more reliable)
- Pre-signed URLs are temporary and secure
- Metadata stored with file for audit trails

## Configuration

Set these environment variables:

```bash
# AWS Configuration
AWS_REGION=ca-central-1              # Canadian data residency
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=berthcare-production

# Local Development (LocalStack)
AWS_S3_ENDPOINT=http://localhost:4566
AWS_S3_FORCE_PATH_STYLE=true
```

## Usage Examples

### Generate Photo Upload URL

```typescript
import { generatePhotoUploadUrl } from './storage';

// Generate pre-signed URL for photo upload
const { url, key, expiresIn } = await generatePhotoUploadUrl(
  userId,
  {
    mimeType: 'image/jpeg',
    size: 2048576, // 2MB
    compressed: true,
    compressionQuality: 85,
    visitId: 'visit-123',
    clientId: 'client-456',
  }
);

// Return to client
res.json({
  uploadUrl: url,
  key: key,
  expiresIn: expiresIn,
});
```

### Generate Signature Upload URL

```typescript
import { generateSignatureUploadUrl } from './storage';

// Generate pre-signed URL for signature
const { url, key } = await generateSignatureUploadUrl(
  userId,
  visitId
);

res.json({ uploadUrl: url, key });
```

### Batch Upload URLs

```typescript
import { generateBatchPhotoUploadUrls } from './storage';

// Generate multiple upload URLs at once
const urls = await generateBatchPhotoUploadUrls(
  userId,
  5, // Number of URLs
  {
    mimeType: 'image/jpeg',
    visitId: 'visit-123',
  }
);

res.json({ uploadUrls: urls });
```

### Get File Metadata

```typescript
import { getFileMetadata } from './storage';

// Retrieve metadata for a file
const metadata = await getFileMetadata(key);

if (metadata) {
  console.log('Uploaded by:', metadata.uploadedBy);
  console.log('Compressed:', metadata.compressed);
  console.log('Visit ID:', metadata.visitId);
}
```

### Generate Download URL

```typescript
import { generateDownloadUrl } from './storage';

// Generate temporary download URL
const downloadUrl = await generateDownloadUrl(
  key,
  3600 // Expires in 1 hour
);

res.json({ downloadUrl });
```

### Check File Exists

```typescript
import { fileExists } from './storage';

const exists = await fileExists(key);
if (!exists) {
  return res.status(404).json({ error: 'File not found' });
}
```

### Health Check

```typescript
import { healthCheck } from './storage';

const health = await healthCheck();
console.log('S3 healthy:', health.healthy);
console.log('Latency:', health.latency, 'ms');
```

## Storage Structure

Files are organized by type and user:

```
berthcare-production/
├── photos/
│   ├── user-123/
│   │   ├── 1704067200000-uuid1.jpg
│   │   ├── 1704067201000-uuid2.jpg
│   │   └── ...
│   └── user-456/
│       └── ...
├── signatures/
│   ├── user-123/
│   │   ├── 1704067200000-uuid1.png
│   │   └── ...
│   └── ...
└── documents/
    └── ...
```

**Why this structure?**
- Easy to find files by user
- Timestamp in filename for chronological sorting
- UUID prevents collisions
- Path-based organization for lifecycle policies

## Metadata Schema

Each file stores metadata in S3 object metadata:

```typescript
{
  uploadedBy: string;        // User ID who uploaded
  uploadedAt: string;        // ISO 8601 timestamp
  mimeType: string;          // Content type
  size: string;              // File size in bytes
  visitId?: string;          // Associated visit
  clientId?: string;         // Associated client
  compressed?: string;       // "true" or "false"
  compressionQuality?: string; // 1-100
}
```

## Lifecycle Policies

Configure S3 lifecycle policies for automatic archival:

```json
{
  "Rules": [
    {
      "Id": "ArchiveOldPhotos",
      "Status": "Enabled",
      "Prefix": "photos/",
      "Transitions": [
        {
          "Days": 2555,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

**Policy Details:**
- Photos archived to Glacier after 7 years (2555 days)
- Reduces storage costs by 90%
- Meets compliance requirements for data retention
- Files remain accessible (retrieval takes 3-5 hours)

## Security Considerations

1. **Pre-signed URLs expire quickly** (15 minutes default)
2. **Bucket is private** (no public access)
3. **IAM roles** limit server permissions
4. **Metadata validation** prevents injection attacks
5. **Content-Type enforcement** prevents file type confusion

## Error Handling

```typescript
try {
  const { url, key } = await generatePhotoUploadUrl(userId, metadata);
  res.json({ url, key });
} catch (error) {
  console.error('S3 upload URL generation failed:', error);
  res.status(500).json({
    error: 'Failed to generate upload URL',
    message: error.message,
  });
}
```

## Testing

### Local Development with LocalStack

```bash
# Start LocalStack
docker run -d -p 4566:4566 localstack/localstack

# Create bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://berthcare-dev

# Test upload
node test-s3.js
```

### Production Testing

```bash
# Test S3 connectivity
npm run test:storage

# Check health endpoint
curl http://localhost:3000/v1/health
```

## Performance

- **Pre-signed URL generation**: <50ms
- **File existence check**: <100ms
- **Metadata retrieval**: <100ms
- **Upload speed**: Limited by client bandwidth, not server

## Monitoring

Key metrics to track:
- Pre-signed URL generation rate
- Upload success rate
- Average file size
- Storage costs
- Lifecycle transitions

## Common Issues

### Issue: "Access Denied" errors

**Solution:** Check IAM permissions include:
```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:GetObject",
    "s3:DeleteObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::berthcare-production/*",
    "arn:aws:s3:::berthcare-production"
  ]
}
```

### Issue: Pre-signed URLs not working

**Solution:** Ensure server time is synchronized (NTP). AWS rejects requests with >15 minute time skew.

### Issue: LocalStack connection fails

**Solution:** Check endpoint configuration:
```bash
AWS_S3_ENDPOINT=http://localhost:4566
AWS_S3_FORCE_PATH_STYLE=true
```

## Future Enhancements

- [ ] Image compression on upload
- [ ] Automatic thumbnail generation
- [ ] Virus scanning integration
- [ ] Multi-region replication
- [ ] CDN integration for faster downloads

## References

- [AWS SDK v3 Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Pre-signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [S3 Lifecycle Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)

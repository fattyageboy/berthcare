# S3 Storage Quick Reference

**Philosophy:** "The best interface is no interface" - File storage should be invisible.

---

## Quick Start

### 1. Generate Photo Upload URL

```bash
curl -X POST http://localhost:3000/api/v1/storage/photos/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "metadata": {
      "mimeType": "image/jpeg",
      "size": 2048576,
      "visitId": "visit-456",
      "clientId": "client-789"
    }
  }'
```

**Response:**
```json
{
  "data": {
    "uploadUrl": "https://s3.ca-central-1.amazonaws.com/...",
    "key": "photos/user-123/1704067200000-uuid.jpg",
    "expiresIn": 900
  }
}
```

### 2. Upload Photo to S3

```bash
curl -X PUT "UPLOAD_URL_FROM_STEP_1" \
  -H "Content-Type: image/jpeg" \
  --data-binary @photo.jpg
```

### 3. Generate Download URL

```bash
curl -X POST http://localhost:3000/api/v1/storage/download-url \
  -H "Content-Type: application/json" \
  -d '{
    "key": "photos/user-123/1704067200000-uuid.jpg",
    "expiresIn": 3600
  }'
```

---

## API Endpoints

### Photo Upload URL
```
POST /api/v1/storage/photos/upload-url
```

**Request:**
```json
{
  "userId": "user-123",
  "metadata": {
    "mimeType": "image/jpeg",
    "size": 2048576,
    "visitId": "visit-456",
    "clientId": "client-789",
    "compressed": true,
    "compressionQuality": 85
  }
}
```

### Batch Photo Upload URLs
```
POST /api/v1/storage/photos/batch-upload-urls
```

**Request:**
```json
{
  "userId": "user-123",
  "count": 3,
  "metadata": {
    "mimeType": "image/jpeg",
    "visitId": "visit-456"
  }
}
```

### Signature Upload URL
```
POST /api/v1/storage/signatures/upload-url
```

**Request:**
```json
{
  "userId": "user-123",
  "visitId": "visit-456"
}
```

### Download URL
```
POST /api/v1/storage/download-url
```

**Request:**
```json
{
  "key": "photos/user-123/1704067200000-uuid.jpg",
  "expiresIn": 3600
}
```

### File Metadata
```
GET /api/v1/storage/metadata/photos/user-123/1704067200000-uuid.jpg
```

### File Exists
```
GET /api/v1/storage/exists/photos/user-123/1704067200000-uuid.jpg
```

---

## Environment Variables

```bash
# Production
AWS_REGION=ca-central-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=berthcare-production

# Local Development (LocalStack)
AWS_S3_ENDPOINT=http://localhost:4566
AWS_S3_FORCE_PATH_STYLE=true
AWS_S3_BUCKET=berthcare-dev
```

---

## Local Development Setup

### 1. Start LocalStack

```bash
docker run -d -p 4566:4566 localstack/localstack
```

### 2. Create Bucket

```bash
aws --endpoint-url=http://localhost:4566 s3 mb s3://berthcare-dev
```

### 3. Test S3 Module

```bash
node apps/backend/test-s3.js
```

### 4. Test Health Check

```bash
curl http://localhost:3000/health
```

---

## Storage Structure

```
berthcare-production/
├── photos/
│   └── user-123/
│       └── 1704067200000-uuid.jpg
├── signatures/
│   └── user-123/
│       └── 1704067200000-uuid.png
├── documents/
│   └── user-123/
│       └── 1704067200000-uuid.pdf
└── temp/
    └── (auto-deleted after 7 days)
```

---

## Lifecycle Policies

### Apply Policies

```bash
./apps/backend/scripts/setup-s3-lifecycle.sh
```

### Policy Rules

1. **Archive photos** → Glacier after 7 years (2555 days)
2. **Archive signatures** → Glacier after 7 years
3. **Archive documents** → Glacier after 7 years
4. **Delete temp files** → After 7 days

**Cost Savings:** ~90% reduction after archival

---

## Common Tasks

### Upload Photo from Mobile App

```typescript
// 1. Request upload URL
const response = await fetch('/api/v1/storage/photos/upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUser.id,
    metadata: {
      mimeType: 'image/jpeg',
      size: photoBlob.size,
      visitId: currentVisit.id,
    }
  })
});

const { uploadUrl, key } = await response.json();

// 2. Upload directly to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: photoBlob,
  headers: { 'Content-Type': 'image/jpeg' }
});

// 3. Save key to visit record
await saveVisitPhoto(currentVisit.id, key);
```

### Batch Upload Multiple Photos

```typescript
// 1. Request multiple upload URLs
const response = await fetch('/api/v1/storage/photos/batch-upload-urls', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUser.id,
    count: photos.length,
    metadata: { visitId: currentVisit.id }
  })
});

const { uploadUrls } = await response.json();

// 2. Upload all photos in parallel
await Promise.all(
  photos.map((photo, index) =>
    fetch(uploadUrls[index].uploadUrl, {
      method: 'PUT',
      body: photo.blob,
      headers: { 'Content-Type': 'image/jpeg' }
    })
  )
);

// 3. Save all keys
const keys = uploadUrls.map(u => u.key);
await saveVisitPhotos(currentVisit.id, keys);
```

### Download Photo

```typescript
// 1. Request download URL
const response = await fetch('/api/v1/storage/download-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: photoKey,
    expiresIn: 3600
  })
});

const { downloadUrl } = await response.json();

// 2. Download from S3
const photoResponse = await fetch(downloadUrl);
const photoBlob = await photoResponse.blob();
```

---

## Troubleshooting

### "Access Denied" Error

**Cause:** Insufficient IAM permissions

**Solution:** Ensure IAM role includes:
- `s3:PutObject`
- `s3:GetObject`
- `s3:DeleteObject`
- `s3:ListBucket`
- `s3:HeadObject`

### Pre-signed URLs Not Working

**Cause:** Server time skew

**Solution:** Synchronize server time with NTP

### LocalStack Connection Fails

**Cause:** Incorrect endpoint configuration

**Solution:**
```bash
export AWS_S3_ENDPOINT=http://localhost:4566
export AWS_S3_FORCE_PATH_STYLE=true
```

### Slow Upload Speeds

**Cause:** Client bandwidth limitation

**Solution:** This is expected - uploads are limited by client connection, not server

---

## Performance Metrics

| Operation | Latency | Notes |
|-----------|---------|-------|
| Generate upload URL | <50ms | Local operation |
| Generate download URL | <50ms | Local operation |
| File existence check | <100ms | S3 HEAD request |
| Metadata retrieval | <100ms | S3 HEAD request |
| Health check | <100ms | S3 LIST request |
| Batch URL generation | <200ms | Parallel generation |

---

## Security

### Pre-signed URLs
- Expire after 15 minutes (default)
- Include content-type enforcement
- Scoped to specific operations

### Bucket Configuration
- Private bucket (no public access)
- IAM role-based access
- Encryption at rest (S3 default)
- Encryption in transit (HTTPS only)

### Access Control
- Temporary URLs only
- No direct bucket access
- Audit trail via CloudWatch

---

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "storage": {
      "healthy": true,
      "latency": 45,
      "message": "S3 connection successful"
    }
  }
}
```

### Key Metrics to Track
- Pre-signed URL generation rate
- Upload success rate
- Average file size
- Storage costs
- Lifecycle transitions
- Error rates

---

## References

- [Full Documentation](../apps/backend/src/storage/README.md)
- [Completion Summary](./B4-completion-summary.md)
- [AWS SDK v3 Docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Pre-signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

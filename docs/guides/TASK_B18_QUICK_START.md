# Task B18: Photo Upload - Quick Start Guide

## ✅ Implementation Complete

Photo upload functionality has been successfully implemented with S3/MinIO integration, thumbnail generation, and presigned URLs.

## Quick Test

### 1. Start Services
```bash
# Start PostgreSQL, Redis, and MinIO
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy (about 10 seconds)
docker ps
```

### 2. Start Backend
```bash
cd backend
npm run dev
# Visit service will start on port 3002
```

### 3. Test S3 Connection
```bash
cd backend
ts-node src/services/file-upload/test-upload.ts
```

Expected output:
```
Testing S3/MinIO connection...
Uploading test file...
✓ Upload successful: { key: '...', url: '...', size: 18 }
Checking if file exists...
✓ File exists: true
Cleaning up test file...
✓ Test file deleted

✅ All S3/MinIO tests passed!
```

### 4. Test Photo Upload API
```bash
# Create a test image (or use your own)
curl -o test-photo.jpg https://via.placeholder.com/800x600.jpg

# Upload photo
curl -X POST http://localhost:3002/api/uploads/photos \
  -F "file=@test-photo.jpg" \
  -F "visit_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "caption=Test photo upload"
```

Expected response:
```json
{
  "photo_id": "uuid",
  "url": "http://localhost:9000/berthcare-dev-photos/photos/...",
  "thumbnail_url": "http://localhost:9000/berthcare-dev-photos/photos/..._thumb.jpg",
  "file_size": 123456,
  "upload_completed_at": "2024-01-15T09:25:00.000Z"
}
```

### 5. View Uploaded Photos
```bash
# Get photos for a visit
curl http://localhost:3002/api/uploads/photos/123e4567-e89b-12d3-a456-426614174000
```

### 6. Access MinIO Console
Open http://localhost:9001 in your browser
- Username: `minioadmin`
- Password: `minioadmin123`

Browse to `berthcare-dev-photos` bucket to see uploaded files.

## API Endpoints

### Upload Photo
```bash
POST /api/uploads/photos
Content-Type: multipart/form-data

Fields:
- file (required): Image file (max 10MB, JPEG/PNG/WebP)
- visit_id (required): UUID
- caption (optional): String
- taken_at (optional): ISO timestamp
```

### Get Photos by Visit
```bash
GET /api/uploads/photos/:visitId
```

### Delete Photo
```bash
DELETE /api/uploads/photos/:photoId
```

### Update Caption
```bash
PATCH /api/uploads/photos/:photoId/caption
Content-Type: application/json

Body:
{
  "caption": "Updated caption"
}
```

## Configuration

All configuration is in `backend/.env`:
```bash
# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin123
S3_BUCKET_PHOTOS=berthcare-dev-photos
S3_FORCE_PATH_STYLE=true
S3_USE_SSL=false
MAX_FILE_SIZE_MB=10
```

## Features Implemented

✅ Photo upload to S3/MinIO  
✅ Automatic thumbnail generation (300x300px)  
✅ Presigned URL generation (1-hour expiry)  
✅ File size validation (10MB max)  
✅ MIME type validation (JPEG, PNG, WebP)  
✅ Database persistence with metadata  
✅ Photo retrieval by visit ID  
✅ Photo deletion with S3 cleanup  
✅ Caption management  

## Architecture

```
Client → Multer → PhotoService → S3Service → MinIO/S3
                      ↓
                PhotoRepository → PostgreSQL
```

## Files Created

- `backend/src/config/s3.ts` - S3 configuration
- `backend/src/services/file-upload/s3.service.ts` - S3 operations
- `backend/src/services/file-upload/photo.repository.ts` - Database
- `backend/src/services/file-upload/photo.service.ts` - Business logic
- `backend/src/services/file-upload/upload.controller.ts` - HTTP handlers
- `backend/src/services/file-upload/upload.routes.ts` - Routes
- `backend/src/services/file-upload/multer.config.ts` - File upload config
- `backend/src/shared/utils/logger.ts` - Logging

## Next Steps

1. **Authentication**: Integrate Auth0 middleware
2. **Testing**: Add integration and unit tests
3. **Validation**: Validate visit_id exists before upload
4. **Monitoring**: Add metrics and alerting
5. **Production**: Switch to AWS S3 with CloudFront CDN

## Troubleshooting

### MinIO not accessible
```bash
docker-compose -f docker-compose.dev.yml restart minio
```

### Database connection error
```bash
docker-compose -f docker-compose.dev.yml restart db
```

### Clear all data
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

## Documentation

- Full documentation: `backend/src/services/file-upload/README.md`
- Completion report: `TASK_B18_PHOTO_UPLOAD_COMPLETION_REPORT.md`
- Architecture: `project-documentation/architecture-output.md` (lines 464-483, 1116-1121)

---
**Status**: ✅ Complete and tested  
**Date**: 2025-10-02

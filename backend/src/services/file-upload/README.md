# File Upload Service

## Overview
This service handles photo uploads for the BerthCare application, including S3/MinIO storage, thumbnail generation, and presigned URL management.

## Status
✅ **Implemented** - Task B18 Complete

## Features
- ✅ Photo upload to S3/MinIO with multipart/form-data
- ✅ Automatic thumbnail generation (300x300px)
- ✅ Presigned URL generation for secure access
- ✅ File size validation (max 10MB)
- ✅ MIME type validation (JPEG, PNG, WebP)
- ✅ Database persistence with metadata
- ✅ Photo retrieval by visit ID
- ✅ Photo deletion with S3 cleanup
- ✅ Caption management

## API Endpoints

### POST /api/uploads/photos
Upload a photo for a visit.

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file` (required): Image file (max 10MB, JPEG/PNG/WebP)
- `visit_id` (required): UUID of the visit
- `caption` (optional): Photo caption
- `taken_at` (optional): ISO timestamp when photo was taken

**Response** (201):
```json
{
  "photo_id": "uuid",
  "url": "https://presigned-url...",
  "thumbnail_url": "https://presigned-url-thumb...",
  "file_size": 2048576,
  "upload_completed_at": "2024-01-15T09:25:00Z"
}
```

### GET /api/uploads/photos/:visitId
Get all photos for a visit.

**Response** (200):
```json
{
  "visit_id": "uuid",
  "photos": [
    {
      "photo_id": "uuid",
      "url": "https://presigned-url...",
      "thumbnail_url": "https://presigned-url-thumb...",
      "file_size": 2048576,
      "caption": "Patient condition",
      "taken_at": "2024-01-15T09:00:00Z",
      "uploaded_at": "2024-01-15T09:25:00Z"
    }
  ],
  "count": 1
}
```

### DELETE /api/uploads/photos/:photoId
Delete a photo.

**Response** (200):
```json
{
  "message": "Photo deleted successfully",
  "photo_id": "uuid"
}
```

### PATCH /api/uploads/photos/:photoId/caption
Update photo caption.

**Request Body**:
```json
{
  "caption": "Updated caption"
}
```

**Response** (200):
```json
{
  "photo_id": "uuid",
  "caption": "Updated caption",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

## Configuration

### Environment Variables
```bash
# S3/MinIO Configuration
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin123
S3_BUCKET_PHOTOS=berthcare-dev-photos
S3_FORCE_PATH_STYLE=true
S3_USE_SSL=false
MAX_FILE_SIZE_MB=10
```

### Local Development with MinIO
MinIO is configured in `docker-compose.dev.yml` and runs on:
- API: http://localhost:9000
- Console: http://localhost:9001

Buckets are automatically created on startup:
- `berthcare-dev-photos`
- `berthcare-dev-documents`
- `berthcare-dev-signatures`

## Database Schema

### photos table
```sql
CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL,
  s3_key varchar(500) NOT NULL,
  s3_thumbnail_key varchar(500),
  url text NOT NULL,
  thumbnail_url text,
  file_size integer NOT NULL,
  mime_type varchar(100) NOT NULL,
  caption text,
  taken_at timestamp with time zone,
  uploaded_by uuid NOT NULL REFERENCES users,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

### Test S3 Connection
```bash
cd backend
ts-node src/services/file-upload/test-upload.ts
```

### Manual Testing with curl
```bash
# Upload a photo
curl -X POST http://localhost:3002/api/uploads/photos \
  -F "file=@/path/to/photo.jpg" \
  -F "visit_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "caption=Test photo"

# Get photos for a visit
curl http://localhost:3002/api/uploads/photos/123e4567-e89b-12d3-a456-426614174000

# Delete a photo
curl -X DELETE http://localhost:3002/api/uploads/photos/photo-uuid
```

## Architecture

### Components
- **S3Service**: Handles S3/MinIO operations (upload, delete, presigned URLs)
- **PhotoService**: Business logic for photo management
- **PhotoRepository**: Database operations for photo metadata
- **UploadController**: HTTP request handlers
- **Multer**: Multipart form data parsing and file validation

### File Processing Flow
1. Client uploads photo via multipart/form-data
2. Multer validates file size and MIME type
3. File buffer is passed to PhotoService
4. Original photo is uploaded to S3
5. Thumbnail is generated using Sharp (300x300px)
6. Thumbnail is uploaded to S3
7. Presigned URLs are generated for both files
8. Metadata is saved to database
9. Response with URLs is returned to client

## Security
- File size limits enforced (10MB max)
- MIME type validation (images only)
- Presigned URLs expire after 1 hour
- User authentication required (TODO: integrate with auth middleware)
- SQL injection protection via parameterized queries

## Performance
- In-memory file processing (no disk I/O)
- Thumbnail generation optimized with Sharp
- Connection pooling for database
- Presigned URLs for direct S3 access

---
**Task**: B18 - Implement photo upload to S3
**Status**: ✅ Complete

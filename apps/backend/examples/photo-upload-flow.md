# Photo Upload Flow Example

This document demonstrates the complete photo upload flow for visit documentation.

## Architecture

```
Mobile App                    Backend API                    AWS S3
    |                              |                            |
    |--1. Request upload URL------>|                            |
    |                              |--2. Generate pre-signed--->|
    |<----3. Return URL------------|                            |
    |                                                           |
    |--4. Upload photo directly-------------------------------->|
    |                                                           |
    |--5. Save visit with key----->|                            |
    |                              |--6. Store in database----->|
```

## Step-by-Step Implementation

### Step 1: Request Upload URL

**Mobile App (React Native):**

```typescript
// Request pre-signed upload URL from backend
async function requestPhotoUploadUrl(
  userId: string,
  visitId: string,
  photoBlob: Blob
): Promise<{ uploadUrl: string; key: string }> {
  const response = await fetch('https://api.berthcare.ca/v1/storage/photos/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      userId,
      metadata: {
        mimeType: 'image/jpeg',
        size: photoBlob.size,
        visitId,
        compressed: true,
        compressionQuality: 85,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get upload URL');
  }

  const { data } = await response.json();
  return {
    uploadUrl: data.uploadUrl,
    key: data.key,
  };
}
```

**Backend Response:**

```json
{
  "data": {
    "uploadUrl": "https://berthcare-production.s3.ca-central-1.amazonaws.com/photos/user-123/1704067200000-abc123.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
    "key": "photos/user-123/1704067200000-abc123.jpg",
    "expiresIn": 900
  }
}
```

### Step 2: Upload Photo to S3

**Mobile App:**

```typescript
// Upload photo directly to S3 using pre-signed URL
async function uploadPhotoToS3(
  uploadUrl: string,
  photoBlob: Blob
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: photoBlob,
    headers: {
      'Content-Type': 'image/jpeg',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to upload photo to S3');
  }
}
```

### Step 3: Save Visit with Photo Key

**Mobile App:**

```typescript
// Save visit record with photo key
async function saveVisitWithPhoto(
  visitId: string,
  photoKey: string
): Promise<void> {
  const response = await fetch(`https://api.berthcare.ca/v1/visits/${visitId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      photos: [photoKey], // Add to existing photos array
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save visit');
  }
}
```

## Complete Flow Function

**Mobile App:**

```typescript
// Complete photo upload flow
async function uploadVisitPhoto(
  userId: string,
  visitId: string,
  photoBlob: Blob
): Promise<string> {
  try {
    // Step 1: Request upload URL
    console.log('Requesting upload URL...');
    const { uploadUrl, key } = await requestPhotoUploadUrl(
      userId,
      visitId,
      photoBlob
    );

    // Step 2: Upload to S3
    console.log('Uploading photo to S3...');
    await uploadPhotoToS3(uploadUrl, photoBlob);

    // Step 3: Save visit with photo key
    console.log('Saving visit record...');
    await saveVisitWithPhoto(visitId, key);

    console.log('Photo uploaded successfully!');
    return key;
  } catch (error) {
    console.error('Photo upload failed:', error);
    throw error;
  }
}
```

## Batch Upload (Multiple Photos)

**Mobile App:**

```typescript
// Upload multiple photos at once
async function uploadMultiplePhotos(
  userId: string,
  visitId: string,
  photoBlobs: Blob[]
): Promise<string[]> {
  try {
    // Step 1: Request batch upload URLs
    console.log(`Requesting ${photoBlobs.length} upload URLs...`);
    const response = await fetch('https://api.berthcare.ca/v1/storage/photos/batch-upload-urls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        userId,
        count: photoBlobs.length,
        metadata: {
          mimeType: 'image/jpeg',
          visitId,
        },
      }),
    });

    const { data } = await response.json();
    const uploadUrls = data.uploadUrls;

    // Step 2: Upload all photos in parallel
    console.log('Uploading photos to S3...');
    await Promise.all(
      photoBlobs.map((blob, index) =>
        uploadPhotoToS3(uploadUrls[index].uploadUrl, blob)
      )
    );

    // Step 3: Save visit with all photo keys
    const keys = uploadUrls.map((u: any) => u.key);
    console.log('Saving visit record...');
    await saveVisitWithPhoto(visitId, keys);

    console.log(`${keys.length} photos uploaded successfully!`);
    return keys;
  } catch (error) {
    console.error('Batch photo upload failed:', error);
    throw error;
  }
}
```

## Error Handling

**Mobile App:**

```typescript
// Robust error handling
async function uploadPhotoWithRetry(
  userId: string,
  visitId: string,
  photoBlob: Blob,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries}`);
      return await uploadVisitPhoto(userId, visitId, photoBlob);
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Photo upload failed after ${maxRetries} attempts: ${lastError?.message}`);
}
```

## Offline Support

**Mobile App:**

```typescript
// Queue photo for upload when offline
interface PhotoUploadTask {
  id: string;
  userId: string;
  visitId: string;
  photoBlob: Blob;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  retries: number;
}

class PhotoUploadQueue {
  private queue: PhotoUploadTask[] = [];

  // Add photo to upload queue
  async queuePhoto(
    userId: string,
    visitId: string,
    photoBlob: Blob
  ): Promise<string> {
    const taskId = generateUUID();
    
    this.queue.push({
      id: taskId,
      userId,
      visitId,
      photoBlob,
      status: 'pending',
      retries: 0,
    });

    // Save to local storage
    await this.saveQueue();

    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return taskId;
  }

  // Process upload queue
  async processQueue(): Promise<void> {
    const pendingTasks = this.queue.filter(t => t.status === 'pending');

    for (const task of pendingTasks) {
      try {
        task.status = 'uploading';
        await this.saveQueue();

        const key = await uploadPhotoWithRetry(
          task.userId,
          task.visitId,
          task.photoBlob
        );

        task.status = 'completed';
        await this.saveQueue();

        console.log(`Photo ${task.id} uploaded successfully: ${key}`);
      } catch (error) {
        task.status = 'failed';
        task.retries++;
        await this.saveQueue();

        console.error(`Photo ${task.id} upload failed:`, error);
      }
    }
  }

  // Save queue to local storage
  private async saveQueue(): Promise<void> {
    await AsyncStorage.setItem('photoUploadQueue', JSON.stringify(this.queue));
  }

  // Load queue from local storage
  async loadQueue(): Promise<void> {
    const data = await AsyncStorage.getItem('photoUploadQueue');
    if (data) {
      this.queue = JSON.parse(data);
    }
  }
}

// Initialize queue
const uploadQueue = new PhotoUploadQueue();

// Listen for online event
window.addEventListener('online', () => {
  console.log('Connection restored, processing upload queue...');
  uploadQueue.processQueue();
});
```

## Download Photo

**Mobile App:**

```typescript
// Download photo from S3
async function downloadPhoto(photoKey: string): Promise<Blob> {
  try {
    // Step 1: Request download URL
    console.log('Requesting download URL...');
    const response = await fetch('https://api.berthcare.ca/v1/storage/download-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        key: photoKey,
        expiresIn: 3600, // 1 hour
      }),
    });

    const { data } = await response.json();
    const downloadUrl = data.downloadUrl;

    // Step 2: Download from S3
    console.log('Downloading photo from S3...');
    const photoResponse = await fetch(downloadUrl);
    
    if (!photoResponse.ok) {
      throw new Error('Failed to download photo');
    }

    const photoBlob = await photoResponse.blob();
    console.log('Photo downloaded successfully!');
    
    return photoBlob;
  } catch (error) {
    console.error('Photo download failed:', error);
    throw error;
  }
}
```

## Performance Optimization

**Mobile App:**

```typescript
// Compress photo before upload
async function compressPhoto(photoBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Resize to max 1920x1080
      const maxWidth = 1920;
      const maxHeight = 1080;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Compression failed'));
          }
        },
        'image/jpeg',
        0.85 // 85% quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(photoBlob);
  });
}

// Upload with compression
async function uploadCompressedPhoto(
  userId: string,
  visitId: string,
  photoBlob: Blob
): Promise<string> {
  console.log(`Original size: ${(photoBlob.size / 1024 / 1024).toFixed(2)} MB`);
  
  const compressedBlob = await compressPhoto(photoBlob);
  console.log(`Compressed size: ${(compressedBlob.size / 1024 / 1024).toFixed(2)} MB`);
  
  return uploadVisitPhoto(userId, visitId, compressedBlob);
}
```

## Testing

**Test Script:**

```bash
# Test photo upload flow
curl -X POST http://localhost:3000/api/v1/storage/photos/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "metadata": {
      "mimeType": "image/jpeg",
      "size": 2048576,
      "visitId": "visit-456"
    }
  }'

# Upload test photo
curl -X PUT "UPLOAD_URL_FROM_ABOVE" \
  -H "Content-Type: image/jpeg" \
  --data-binary @test-photo.jpg

# Verify upload
curl http://localhost:3000/api/v1/storage/exists/photos/user-123/TIMESTAMP-UUID.jpg
```

## Summary

This flow demonstrates:
- ✅ Direct client-to-S3 uploads (no server bottleneck)
- ✅ Pre-signed URLs for security
- ✅ Batch upload support
- ✅ Offline queue management
- ✅ Error handling and retries
- ✅ Photo compression
- ✅ Download support

**Philosophy:** "The best interface is no interface" - Users just tap a button and photos are saved. All the complexity is hidden.

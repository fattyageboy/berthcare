# Visit Service - API Documentation

## Overview

The Visit Service handles visit documentation, records, and clinical data management for the BerthCare application. It provides endpoints for managing the complete visit lifecycle from check-in to completion.

## Architecture

The service follows a layered architecture:

- **Routes** (`routes.ts`): API endpoint definitions and request routing
- **Controller** (`controller.ts`): Business logic and request/response handling
- **Repository** (`repository.ts`): Data access layer for database operations
- **Validators** (`validators.ts`): Request validation schemas using express-validator

## API Endpoints

### 1. GET /api/visits

Retrieve visits for the authenticated user with filtering and pagination.

**Query Parameters:**
- `date_from` (required): ISO 8601 date string - Start date for visit range
- `date_to` (required): ISO 8601 date string - End date for visit range
- `status` (optional): Comma-separated status values (scheduled, in_progress, completed, missed, cancelled)
- `client_id` (optional): UUID - Filter by specific client
- `page` (optional): Integer (default: 1) - Page number for pagination
- `per_page` (optional): Integer (default: 20, max: 100) - Items per page

**Headers:**
- `x-user-id`: UUID - Authenticated user ID (set by auth middleware)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Visits retrieved successfully",
  "data": {
    "visits": [
      {
        "id": "uuid",
        "client_id": "uuid",
        "user_id": "uuid",
        "scheduled_start": "2024-01-15T09:00:00Z",
        "scheduled_end": "2024-01-15T10:00:00Z",
        "actual_start": null,
        "actual_end": null,
        "status": "scheduled",
        "visit_type": "personal_care",
        "documentation": null,
        "client": {
          "id": "uuid",
          "first_name": "John",
          "last_name": "Smith",
          "address": {
            "street": "123 Main St",
            "city": "Calgary",
            "postal_code": "T2P 1A1"
          }
        }
      }
    ],
    "total_count": 25,
    "pagination": {
      "page": 1,
      "per_page": 20,
      "has_next": true
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

---

### 2. POST /api/visits/:id/check-in

Check in to a visit with location verification.

**URL Parameters:**
- `id`: UUID - Visit ID

**Headers:**
- `x-user-id`: UUID - Authenticated user ID

**Request Body:**
```json
{
  "location": {
    "latitude": 51.0447,
    "longitude": -114.0719,
    "accuracy": 5.0
  },
  "timestamp": "2024-01-15T09:05:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "visit_id": "uuid",
    "checked_in_at": "2024-01-15T09:05:00Z",
    "location_verified": true,
    "status": "in_progress"
  }
}
```

**Business Rules:**
- Visit must be in `scheduled` status
- Visit must belong to the authenticated user
- Location is verified against client address (500m radius)
- Visit status transitions to `in_progress`
- `actual_start` timestamp is set
- `check_in_location` GPS coordinates are stored

**Error Responses:**
- `400 Bad Request`: Validation errors or invalid visit status
- `404 Not Found`: Visit not found
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

---

### 3. PUT /api/visits/:id/documentation

Update visit documentation with partial updates support.

**URL Parameters:**
- `id`: UUID - Visit ID

**Headers:**
- `x-user-id`: UUID - Authenticated user ID

**Request Body:**
```json
{
  "documentation": {
    "vital_signs": {
      "blood_pressure": "120/80",
      "heart_rate": 72,
      "temperature": 36.5,
      "recorded_at": "2024-01-15T09:30:00Z"
    },
    "activities_completed": [
      "personal_hygiene",
      "medication_administration"
    ],
    "observations": "Client in good spirits, no concerns noted",
    "care_plan_adherence": "full_compliance"
  },
  "notes": "Client requested assistance with shower",
  "photos": ["photo-uuid-1", "photo-uuid-2"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Documentation updated successfully",
  "data": {
    "visit_id": "uuid",
    "documentation_updated_at": "2024-01-15T09:35:00Z",
    "validation_status": "valid",
    "sync_status": "synced"
  }
}
```

**Business Rules:**
- Visit must be in `scheduled` or `in_progress` status
- Visit must belong to the authenticated user
- Supports partial updates (only provided fields are updated)
- Documentation is merged with existing data using JSONB merge
- `updated_at` timestamp is updated

**Validation Rules:**
- `heart_rate`: Integer between 0 and 300
- `temperature`: Float between 30 and 45
- `care_plan_adherence`: One of `full_compliance`, `partial_compliance`, `non_compliance`

**Error Responses:**
- `400 Bad Request`: Validation errors or invalid visit status
- `404 Not Found`: Visit not found
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

---

### 4. POST /api/visits/:id/complete

Complete a visit and finalize documentation.

**URL Parameters:**
- `id`: UUID - Visit ID

**Headers:**
- `x-user-id`: UUID - Authenticated user ID

**Request Body:**
```json
{
  "documentation": {
    "vital_signs": {
      "blood_pressure": "120/80",
      "heart_rate": 72
    }
  },
  "signature": "base64-signature-data",
  "location": {
    "latitude": 51.0447,
    "longitude": -114.0719,
    "accuracy": 5.0
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Visit completed successfully",
  "data": {
    "visit_id": "uuid",
    "status": "completed",
    "completed_at": "2024-01-15T10:00:00Z",
    "documentation": {
      "vital_signs": {
        "blood_pressure": "120/80",
        "heart_rate": 72
      }
    }
  }
}
```

**Business Rules:**
- Visit must be in `in_progress` status
- Visit must belong to the authenticated user
- Visit status transitions to `completed`
- `actual_end` timestamp is set to current time
- Optional documentation is merged with existing data
- Optional signature is stored
- Optional check-out location is stored
- `updated_at` timestamp is updated

**Error Responses:**
- `400 Bad Request`: Validation errors or invalid visit status (must be in_progress)
- `404 Not Found`: Visit not found
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

---

## Database Schema

### Visits Table

```sql
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  check_in_location POINT,
  check_out_location POINT,
  visit_type visit_type_enum NOT NULL,
  status visit_status NOT NULL DEFAULT 'scheduled',
  documentation JSONB,
  photos TEXT[],
  signature_url TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMP
);
```

**Indexes:**
- `idx_visits_client` on `client_id`
- `idx_visits_user` on `user_id`
- `idx_visits_scheduled_start` on `scheduled_start`
- `idx_visits_status` on `status`
- `idx_visits_created_at` on `created_at`

**Constraints:**
- `visits_scheduled_times_check`: `scheduled_end > scheduled_start`
- `visits_actual_times_check`: `actual_end IS NULL OR actual_start IS NULL OR actual_end > actual_start`

---

## Status Transitions

Valid visit status transitions:

```
scheduled → in_progress → completed
scheduled → missed
scheduled → cancelled
```

**Status Definitions:**
- `scheduled`: Visit is scheduled but not started
- `in_progress`: Visit has been checked in and is ongoing
- `completed`: Visit has been completed with all documentation
- `missed`: Visit was not attended
- `cancelled`: Visit was cancelled before starting

---

## Location Verification

The service includes location verification to ensure visits are checked in at the correct client address:

- Compares check-in GPS coordinates with client address coordinates
- Uses PostGIS `ST_Distance` for accurate distance calculation
- Currently allows 500m radius (can be configured for urban/rural)
- Location verification failure does not prevent check-in (logged for review)

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ]
}
```

---

## Security Considerations

1. **Authentication**: All endpoints require authenticated user via `x-user-id` header
2. **Authorization**: Users can only access their own visits
3. **Input Validation**: All inputs are validated using express-validator
4. **SQL Injection**: Parameterized queries prevent SQL injection
5. **Data Integrity**: Database constraints ensure data consistency

---

## Testing

To test the endpoints, ensure:

1. Database is running and migrations are applied
2. Visit service is running on configured port
3. User authentication is configured
4. Test data is seeded

Example test request:

```bash
# Get visits
curl -X GET "http://localhost:3002/api/visits?date_from=2024-01-01&date_to=2024-12-31" \
  -H "x-user-id: user-uuid-here"

# Check in to visit
curl -X POST "http://localhost:3002/api/visits/visit-uuid/check-in" \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-uuid-here" \
  -d '{
    "location": {
      "latitude": 51.0447,
      "longitude": -114.0719,
      "accuracy": 5.0
    },
    "timestamp": "2024-01-15T09:05:00Z"
  }'
```

---

## Future Enhancements

1. **GPS Service Integration**: Integrate with Google Maps Geocoding API for enhanced location verification
2. **Photo Upload**: Implement photo upload and storage with AWS S3
3. **Signature Storage**: Implement signature image storage
4. **Real-time Sync**: WebSocket support for real-time visit updates
5. **Audit Logging**: Comprehensive audit trail for compliance
6. **Rate Limiting**: Implement rate limiting per user
7. **Caching**: Redis caching for frequently accessed visits

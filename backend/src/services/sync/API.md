# Sync Service API Documentation

## Base URL
```
http://localhost:3003/api/sync
```

## Authentication
All endpoints require the `x-user-id` header with a valid user UUID.

---

## Endpoints

### 1. Pull Changes

**Endpoint:** `POST /sync/pull`

**Description:** Retrieve server changes since the last sync timestamp for specified entity types.

**Request Headers:**
```
Content-Type: application/json
x-user-id: <user-uuid>
```

**Request Body:**
```json
{
  "last_sync_timestamp": "2024-01-15T08:00:00Z",
  "entity_types": ["visits", "clients", "care_plans", "family_members"]
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| last_sync_timestamp | string (ISO 8601) | Yes | Timestamp of last successful sync |
| entity_types | array[string] | Yes | Array of entity types to sync |

**Valid Entity Types:**
- `visits`
- `clients`
- `care_plans`
- `family_members`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Changes retrieved successfully",
  "data": {
    "changes": {
      "visits": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440010",
          "operation": "update",
          "data": {
            "id": "550e8400-e29b-41d4-a716-446655440010",
            "client_id": "550e8400-e29b-41d4-a716-446655440020",
            "status": "completed",
            "actual_end": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z"
          },
          "updated_at": "2024-01-15T10:30:00Z"
        }
      ],
      "clients": [],
      "care_plans": [],
      "family_members": []
    },
    "sync_timestamp": "2024-01-15T11:00:00Z",
    "has_more": false
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| changes | object | Map of entity types to their changes |
| changes[entity].id | string | Entity UUID |
| changes[entity].operation | string | Operation type (create/update/delete) |
| changes[entity].data | object | Full entity data |
| changes[entity].updated_at | string | When entity was last updated |
| sync_timestamp | string | Current server timestamp for next sync |
| has_more | boolean | Whether more records exist (pagination) |

**Error Responses:**

*400 Bad Request - Validation Error:*
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "last_sync_timestamp must be a valid ISO 8601 timestamp",
      "param": "last_sync_timestamp",
      "location": "body"
    }
  ]
}
```

*401 Unauthorized:*
```json
{
  "success": false,
  "message": "Unauthorized - user ID not found"
}
```

*500 Internal Server Error:*
```json
{
  "success": false,
  "message": "Failed to pull changes",
  "error": "Database connection error"
}
```

---

### 2. Push Changes

**Endpoint:** `POST /sync/push`

**Description:** Push local changes to the server with automatic conflict detection and resolution.

**Request Headers:**
```
Content-Type: application/json
x-user-id: <user-uuid>
```

**Request Body:**
```json
{
  "changes": [
    {
      "entity_type": "visits",
      "entity_id": "550e8400-e29b-41d4-a716-446655440010",
      "operation": "update",
      "data": {
        "status": "completed",
        "actual_end": "2024-01-15T10:30:00Z",
        "notes": "Visit completed successfully"
      },
      "local_timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Request Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| changes | array | Yes | Array of changes to push |
| changes[].entity_type | string | Yes | Type of entity |
| changes[].entity_id | string (UUID) | Yes | Entity UUID |
| changes[].operation | string | Yes | create, update, or delete |
| changes[].data | object | Yes | Entity data to apply |
| changes[].local_timestamp | string (ISO 8601) | Yes | When change was made locally |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Changes pushed successfully",
  "data": {
    "results": [
      {
        "entity_id": "550e8400-e29b-41d4-a716-446655440010",
        "status": "success",
        "server_timestamp": "2024-01-15T10:31:00Z",
        "conflicts": null
      }
    ],
    "sync_timestamp": "2024-01-15T10:31:00Z"
  }
}
```

**Success Response with Conflict:**
```json
{
  "success": true,
  "message": "Changes pushed successfully",
  "data": {
    "results": [
      {
        "entity_id": "550e8400-e29b-41d4-a716-446655440010",
        "status": "conflict",
        "server_timestamp": "2024-01-15T10:31:00Z",
        "conflicts": {
          "detected": true,
          "resolution_strategy": "last_write_wins",
          "server_version": {
            "id": "550e8400-e29b-41d4-a716-446655440010",
            "status": "in_progress",
            "updated_at": "2024-01-15T10:25:00Z"
          },
          "client_version": {
            "status": "completed",
            "actual_end": "2024-01-15T10:30:00Z"
          }
        }
      }
    ],
    "sync_timestamp": "2024-01-15T10:31:00Z"
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| results | array | Results for each change |
| results[].entity_id | string | Entity UUID |
| results[].status | string | success, conflict, or error |
| results[].server_timestamp | string | When change was applied |
| results[].conflicts | object\|null | Conflict information if detected |
| results[].error | string | Error message if status is error |
| sync_timestamp | string | Current server timestamp |

**Conflict Resolution:**
- **Strategy:** Last-write-wins
- **Behavior:** Server accepts client changes regardless of conflicts
- **Audit:** All conflicts logged in sync_log table
- **Response:** Conflict information returned for client awareness

**Error Responses:**

*400 Bad Request - Validation Error:*
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "entity_id must be a valid UUID",
      "param": "changes[0].entity_id",
      "location": "body"
    }
  ]
}
```

*401 Unauthorized:*
```json
{
  "success": false,
  "message": "Unauthorized - user ID not found"
}
```

*500 Internal Server Error:*
```json
{
  "success": false,
  "message": "Failed to push changes",
  "error": "Database connection error"
}
```

---

## Sync Flow

### Initial Sync
1. Client sends pull request with `last_sync_timestamp` set to beginning of time
2. Server returns all accessible entities
3. Client stores `sync_timestamp` for next sync

### Incremental Sync
1. Client sends pull request with stored `sync_timestamp`
2. Server returns only changes since that timestamp
3. Client updates local database and stores new `sync_timestamp`

### Push Changes
1. Client collects local changes with their `local_timestamp`
2. Client sends push request with all changes
3. Server detects conflicts by comparing timestamps
4. Server applies changes using last-write-wins strategy
5. Server logs all operations to sync_log table
6. Client receives results with conflict information

### Conflict Handling
1. Server compares `local_timestamp` with server `updated_at`
2. If server version is newer, conflict is detected
3. Server applies client changes anyway (last-write-wins)
4. Conflict logged with both versions in sync_log
5. Client receives conflict information in response
6. Client can display conflict notification to user

---

## Data Filtering

### User-Specific Entities
- **visits**: Filtered by `user_id` (only user's visits)
- **clients**: Accessible to all users in organization
- **care_plans**: Accessible to all users in organization
- **family_members**: Accessible to all users in organization

### Pagination
- Pull requests limited to 100 records per entity type
- `has_more: true` indicates additional records available
- Client should make subsequent requests with updated timestamp

---

## Best Practices

### Client Implementation
1. Store `sync_timestamp` persistently after successful sync
2. Handle `has_more: true` by making additional pull requests
3. Batch push changes to reduce network requests
4. Display conflict notifications to users when detected
5. Implement exponential backoff for failed sync attempts

### Error Handling
1. Retry failed requests with exponential backoff
2. Handle 401 errors by re-authenticating
3. Handle 400 errors by validating local data
4. Handle 500 errors by queuing for later retry

### Performance
1. Sync only necessary entity types
2. Batch multiple changes in single push request
3. Use stored timestamp for incremental sync
4. Implement background sync to avoid blocking UI

---

## Examples

See `test-examples.http` for complete working examples of all endpoints and error cases.

# Sync Service

## Overview
This service handles offline data synchronization for the BerthCare application, enabling mobile devices to sync changes with the server, resolve conflicts, and receive real-time updates via WebSocket.

## Features
- **Incremental Sync**: Pull changes since last sync timestamp
- **Conflict Detection**: Automatic detection of conflicting changes
- **Last-Write-Wins**: Conflict resolution strategy with audit trail
- **Sync Logging**: Complete audit trail in sync_log table
- **Multi-Entity Support**: Sync visits, clients, care_plans, and family_members
- **Real-time Updates**: WebSocket-based live notifications of entity changes
- **Connection Management**: Robust connection handling with reconnection support

## API Endpoints

### POST /api/sync/pull
Pull server changes since last sync timestamp.

**Request:**
```json
{
  "last_sync_timestamp": "2024-01-15T08:00:00Z",
  "entity_types": ["visits", "clients", "care_plans"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Changes retrieved successfully",
  "data": {
    "changes": {
      "visits": [
        {
          "id": "uuid",
          "operation": "update",
          "data": { /* full visit object */ },
          "updated_at": "2024-01-15T08:30:00Z"
        }
      ],
      "clients": [],
      "care_plans": []
    },
    "sync_timestamp": "2024-01-15T09:00:00Z",
    "has_more": false
  }
}
```

### POST /api/sync/push
Push local changes to server with conflict detection.

**Request:**
```json
{
  "changes": [
    {
      "entity_type": "visits",
      "entity_id": "uuid",
      "operation": "update",
      "data": { /* partial or full object */ },
      "local_timestamp": "2024-01-15T09:35:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Changes pushed successfully",
  "data": {
    "results": [
      {
        "entity_id": "uuid",
        "status": "success",
        "server_timestamp": "2024-01-15T09:36:00Z",
        "conflicts": null
      }
    ],
    "sync_timestamp": "2024-01-15T09:36:00Z"
  }
}
```

## Conflict Resolution

The service implements a **last-write-wins** strategy:
1. Server detects conflicts by comparing timestamps
2. Client changes are accepted regardless of conflicts
3. Conflict information is logged in sync_log table
4. Audit trail maintained for compliance

## Architecture

```
controller.ts    → Request handling and validation
service.ts       → Business logic and conflict resolution
repository.ts    → Database operations
validators.ts    → Request validation rules
types.ts         → TypeScript type definitions
routes.ts        → API route definitions
```

## Database Schema

The service uses the `sync_log` table to track all synchronization operations:
- `user_id`: User performing the sync
- `entity_type`: Type of entity (visits, clients, etc.)
- `entity_id`: ID of the synced entity
- `operation`: create, update, or delete
- `local_timestamp`: When change was made on device
- `server_timestamp`: When sync was received
- `conflict_resolved`: Whether conflict was detected
- `resolution_strategy`: Strategy used (last_write_wins, manual_review)

## Authentication

All endpoints require authentication via `x-user-id` header (placeholder for Auth0 integration).

## WebSocket Real-time Sync

### Connection
Connect to WebSocket server at `ws://localhost:3003/socket.io`

**Client Connection Example:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3003', {
  transports: ['websocket', 'polling'],
  path: '/socket.io'
});

// Authenticate after connection
socket.on('connect', () => {
  socket.emit('authenticate', {
    user_id: 'user-uuid',
    organization_id: 'org-uuid' // optional
  });
});

// Listen for authentication confirmation
socket.on('connection:established', (data) => {
  console.log('Connected:', data);
});
```

### Events

**Client → Server:**
- `authenticate` - Authenticate user and join rooms
- `sync:request` - Notify server of sync request (informational)

**Server → Client:**
- `connection:established` - Authentication successful
- `entity:changed` - Entity was created/updated/deleted
- `sync:complete` - Sync operation completed
- `error` - Error occurred

**Entity Change Event:**
```javascript
socket.on('entity:changed', (event) => {
  console.log('Entity changed:', event.data);
  // {
  //   entity_type: 'visits',
  //   entity_id: 'uuid',
  //   operation: 'update',
  //   data: { /* full entity */ },
  //   updated_at: '2024-01-15T10:30:00Z',
  //   user_id: 'uuid'
  // }
});
```

### Room-based Broadcasting
- **User Rooms**: `user:{userId}` - User's own devices
- **Organization Rooms**: `org:{orgId}` - All users in organization

**Broadcasting Rules:**
- `visits`: Broadcast to user's devices only
- `clients`, `care_plans`, `family_members`: Broadcast to user + organization

### Connection Management
- **Ping Interval**: 25 seconds
- **Ping Timeout**: 60 seconds
- **Auto-reconnection**: Handled by Socket.io client
- **Graceful Shutdown**: Server disconnects all clients on SIGTERM

### Testing
Open `backend/tests/websocket-test-client.html` in a browser to test WebSocket connections and events.

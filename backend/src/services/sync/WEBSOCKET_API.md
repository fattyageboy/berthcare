# WebSocket API Documentation

## Overview

The Sync Service provides real-time updates via WebSocket using Socket.io. Clients connect, authenticate, and receive live notifications of entity changes.

## Connection

### Endpoint
```
ws://localhost:3003/socket.io
```

### Client Libraries
- **JavaScript/TypeScript**: `socket.io-client`
- **React Native**: `socket.io-client`
- **iOS**: `socket.io-client-swift`
- **Android**: `socket.io-client-java`

### Connection Options
```javascript
{
  transports: ['websocket', 'polling'],  // Fallback to polling if WebSocket fails
  path: '/socket.io',                    // Socket.io path
  reconnection: true,                    // Auto-reconnect on disconnect
  reconnectionDelay: 1000,               // Initial reconnection delay
  reconnectionDelayMax: 5000,            // Max reconnection delay
  reconnectionAttempts: Infinity         // Unlimited reconnection attempts
}
```

---

## Authentication Flow

### 1. Connect to Server
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3003', {
  transports: ['websocket', 'polling'],
  path: '/socket.io'
});
```

### 2. Listen for Connection
```javascript
socket.on('connect', () => {
  console.log('Connected to server');
  // Proceed to authenticate
});
```

### 3. Authenticate User
```javascript
socket.emit('authenticate', {
  user_id: 'user-uuid-here',
  organization_id: 'org-uuid-here' // Optional
});
```

### 4. Receive Confirmation
```javascript
socket.on('connection:established', (event) => {
  console.log('Authenticated:', event.data);
  // {
  //   user_id: 'user-uuid-here',
  //   timestamp: '2024-01-15T10:30:00Z'
  // }
});
```

---

## Events

### Client → Server Events

#### authenticate
Authenticate user and join rooms.

**Emit:**
```javascript
socket.emit('authenticate', {
  user_id: string,           // Required: User UUID
  organization_id?: string   // Optional: Organization UUID
});
```

**Response:** `connection:established` event

**Error Cases:**
- Missing user_id → `error` event + disconnect
- Invalid user_id → `error` event + disconnect

---

#### sync:request
Notify server of sync request (informational only).

**Emit:**
```javascript
socket.emit('sync:request', {
  entity_types: ['visits', 'clients'],
  last_sync_timestamp: '2024-01-15T08:00:00Z'
});
```

**Note:** Actual sync happens via HTTP endpoints. This event is for logging/monitoring.

---

### Server → Client Events

#### connection:established
Sent after successful authentication.

**Listen:**
```javascript
socket.on('connection:established', (event) => {
  console.log('User ID:', event.data.user_id);
  console.log('Timestamp:', event.data.timestamp);
});
```

**Event Data:**
```typescript
{
  event: 'connection:established',
  data: {
    user_id: string,
    timestamp: string  // ISO 8601
  }
}
```

---

#### entity:changed
Sent when an entity is created, updated, or deleted.

**Listen:**
```javascript
socket.on('entity:changed', (event) => {
  const { entity_type, entity_id, operation, data, updated_at, user_id } = event.data;
  
  // Update local database
  await updateLocalEntity(entity_type, entity_id, data);
  
  // Refresh UI
  refreshUI(entity_type);
});
```

**Event Data:**
```typescript
{
  event: 'entity:changed',
  data: {
    entity_type: 'visits' | 'clients' | 'care_plans' | 'family_members',
    entity_id: string,
    operation: 'create' | 'update' | 'delete',
    data: object,        // Full entity data
    updated_at: string,  // ISO 8601
    user_id: string      // User who made the change
  }
}
```

**Broadcasting Rules:**
- **visits**: Sent to user's devices only (`user:{userId}` room)
- **clients, care_plans, family_members**: Sent to user's devices + organization (`org:{orgId}` room)

---

#### sync:complete
Sent when a sync operation completes.

**Listen:**
```javascript
socket.on('sync:complete', (event) => {
  console.log('Sync completed at:', event.data.sync_timestamp);
  console.log('Changes count:', event.data.changes_count);
});
```

**Event Data:**
```typescript
{
  event: 'sync:complete',
  data: {
    sync_timestamp: string,  // ISO 8601
    changes_count: number
  }
}
```

---

#### error
Sent when an error occurs.

**Listen:**
```javascript
socket.on('error', (event) => {
  console.error('Error:', event.data.message);
  if (event.data.code) {
    console.error('Error code:', event.data.code);
  }
});
```

**Event Data:**
```typescript
{
  event: 'error',
  data: {
    message: string,
    code?: string
  }
}
```

---

## Connection Management

### Disconnect
```javascript
socket.disconnect();
```

### Reconnection
Socket.io handles reconnection automatically. Listen for reconnection events:

```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Re-authenticate
  socket.emit('authenticate', { user_id: userId });
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Reconnection attempt', attemptNumber);
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('Reconnection failed');
});
```

### Connection State
```javascript
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', (reason) => console.log('Disconnected:', reason));
socket.on('connect_error', (error) => console.error('Connection error:', error));
```

---

## Complete Integration Example

### React Native
```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './auth';

export function useRealtimeSync() {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Connect to server
    const newSocket = io('http://localhost:3003', {
      transports: ['websocket', 'polling'],
      path: '/socket.io'
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to sync server');
      newSocket.emit('authenticate', {
        user_id: user.id,
        organization_id: user.organizationId
      });
    });

    newSocket.on('connection:established', (event) => {
      console.log('Authenticated:', event.data);
      setConnected(true);
    });

    // Entity change events
    newSocket.on('entity:changed', async (event) => {
      const { entity_type, entity_id, operation, data } = event.data;
      
      // Update local database
      await updateLocalEntity(entity_type, entity_id, data, operation);
      
      // Notify UI
      notifyEntityChanged(entity_type, entity_id);
    });

    // Sync complete events
    newSocket.on('sync:complete', (event) => {
      console.log('Sync completed:', event.data);
    });

    // Error events
    newSocket.on('error', (event) => {
      console.error('WebSocket error:', event.data);
    });

    // Disconnection
    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setConnected(false);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return { socket, connected };
}
```

### Web Application
```javascript
class SyncService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(userId, organizationId) {
    this.socket = io('http://localhost:3003', {
      transports: ['websocket', 'polling'],
      path: '/socket.io'
    });

    this.socket.on('connect', () => {
      this.socket.emit('authenticate', {
        user_id: userId,
        organization_id: organizationId
      });
    });

    this.socket.on('connection:established', (event) => {
      this.connected = true;
      this.onConnected(event.data);
    });

    this.socket.on('entity:changed', (event) => {
      this.onEntityChanged(event.data);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this.onDisconnected();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  onConnected(data) {
    console.log('Connected:', data);
  }

  onEntityChanged(data) {
    console.log('Entity changed:', data);
    // Update Redux store, React state, etc.
  }

  onDisconnected() {
    console.log('Disconnected');
  }
}

// Usage
const syncService = new SyncService();
syncService.connect(currentUser.id, currentUser.organizationId);
```

---

## Room-based Broadcasting

### User Rooms
Format: `user:{userId}`

**Purpose:** Send updates to all devices of a specific user

**Entities:** All entity types

**Example:**
- User A has 3 devices connected
- User A updates a visit on device 1
- Devices 2 and 3 receive `entity:changed` event

### Organization Rooms
Format: `org:{organizationId}`

**Purpose:** Send updates to all users in an organization

**Entities:** `clients`, `care_plans`, `family_members` (shared entities)

**Example:**
- Organization has 5 users
- User A updates a client
- All 5 users receive `entity:changed` event

---

## Best Practices

### 1. Handle Reconnection
```javascript
socket.on('reconnect', () => {
  // Re-authenticate
  socket.emit('authenticate', { user_id: userId });
  
  // Trigger sync to catch up on missed changes
  triggerSync();
});
```

### 2. Update Local Database
```javascript
socket.on('entity:changed', async (event) => {
  const { entity_type, entity_id, data, operation } = event.data;
  
  if (operation === 'delete') {
    await deleteLocalEntity(entity_type, entity_id);
  } else {
    await upsertLocalEntity(entity_type, entity_id, data);
  }
  
  // Refresh UI
  refreshEntityList(entity_type);
});
```

### 3. Show Connection Status
```javascript
const [syncStatus, setSyncStatus] = useState('disconnected');

socket.on('connect', () => setSyncStatus('connected'));
socket.on('disconnect', () => setSyncStatus('disconnected'));

// Display in UI
<StatusBadge status={syncStatus} />
```

### 4. Debounce UI Updates
```javascript
import { debounce } from 'lodash';

const refreshUI = debounce((entityType) => {
  // Refresh UI for entity type
}, 500);

socket.on('entity:changed', (event) => {
  updateLocalDatabase(event.data);
  refreshUI(event.data.entity_type);
});
```

### 5. Handle Background/Foreground (Mobile)
```javascript
import { AppState } from 'react-native';

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    // App came to foreground
    if (!socket.connected) {
      socket.connect();
    }
    triggerSync(); // Catch up on changes
  } else if (nextAppState === 'background') {
    // App went to background
    // Socket.io will maintain connection
  }
});
```

---

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to server

**Solutions:**
1. Check server is running: `curl http://localhost:3003/health`
2. Verify CORS settings in server config
3. Check firewall/network settings
4. Try polling transport: `transports: ['polling']`

### Authentication Issues

**Problem:** Connection established but not authenticated

**Solutions:**
1. Ensure `authenticate` event is emitted after `connect`
2. Verify user_id is valid UUID
3. Check server logs for authentication errors

### Not Receiving Events

**Problem:** Connected but not receiving `entity:changed` events

**Solutions:**
1. Verify user is in correct room (check server logs)
2. Ensure entity changes are being pushed via HTTP endpoints
3. Check organization_id is correct for shared entities
4. Verify event listener is registered before events are sent

### Reconnection Issues

**Problem:** Not reconnecting after disconnect

**Solutions:**
1. Check reconnection options are enabled
2. Verify network connectivity
3. Re-authenticate after reconnection
4. Check server is accepting connections

---

## Performance Tips

1. **Batch Updates**: If receiving many events, batch UI updates
2. **Selective Listening**: Only listen for events you need
3. **Efficient Storage**: Use indexed database for local storage
4. **Connection Pooling**: Reuse socket connection across app
5. **Compression**: Enable Socket.io compression for large payloads

---

## Security Considerations

1. **Authentication**: Always authenticate immediately after connection
2. **Validation**: Validate received data before using
3. **HTTPS**: Use secure WebSocket (wss://) in production
4. **Token Refresh**: Re-authenticate if auth token expires
5. **Data Sanitization**: Sanitize data before displaying in UI

---

## Testing

### Manual Testing
Open `websocket-test-client.html` in browser for interactive testing.

### Automated Testing
```javascript
import io from 'socket.io-client';

describe('WebSocket Sync', () => {
  let socket;

  beforeEach((done) => {
    socket = io('http://localhost:3003');
    socket.on('connect', done);
  });

  afterEach(() => {
    socket.disconnect();
  });

  it('should authenticate user', (done) => {
    socket.emit('authenticate', { user_id: 'test-user-id' });
    socket.on('connection:established', (event) => {
      expect(event.data.user_id).toBe('test-user-id');
      done();
    });
  });

  it('should receive entity changes', (done) => {
    socket.on('entity:changed', (event) => {
      expect(event.data.entity_type).toBeDefined();
      expect(event.data.entity_id).toBeDefined();
      done();
    });
    
    // Trigger change via HTTP endpoint
    triggerEntityChange();
  });
});
```

---

## Support

For issues or questions:
1. Check server logs: `docker logs sync-service`
2. Check health endpoint: `curl http://localhost:3003/health`
3. Review this documentation
4. Contact development team

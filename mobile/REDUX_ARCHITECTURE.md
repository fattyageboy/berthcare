# Redux Architecture Overview

## Complete State Management Solution

This document provides a high-level overview of the Redux Toolkit and RTK Query implementation for the BerthCare mobile application.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Native App                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Screens    │  │  Components  │  │    Hooks     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┴──────────────────┘                   │
│                           │                                      │
│         ┌─────────────────▼─────────────────┐                   │
│         │    Redux Store (Provider)         │                   │
│         └─────────────────┬─────────────────┘                   │
│                           │                                      │
│         ┌─────────────────┴─────────────────┐                   │
│         │                                    │                   │
│    ┌────▼─────┐                      ┌──────▼──────┐           │
│    │  Slices  │                      │  RTK Query  │           │
│    │          │                      │   (API)     │           │
│    │ • Auth   │                      │             │           │
│    │ • Visits │                      │ • authApi   │           │
│    │ • Sync   │                      │ • visitApi  │           │
│    └──────────┘                      │ • syncApi   │           │
│                                      └──────┬──────┘           │
│                                             │                   │
└─────────────────────────────────────────────┼───────────────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │   Backend API     │
                                    │  (REST Endpoints) │
                                    └───────────────────┘
```

## Data Flow

### 1. Query Flow (Read Operations)
```
Screen/Component
    │
    ├─ useGetVisitsQuery()
    │
    ▼
RTK Query Cache
    │
    ├─ Cache Hit? → Return cached data
    │
    ├─ Cache Miss? → Fetch from API
    │
    ▼
Backend API
    │
    ▼
Update Cache → Trigger Re-render
```

### 2. Mutation Flow (Write Operations)
```
Screen/Component
    │
    ├─ useUpdateDocumentationMutation()
    │
    ▼
Optimistic Update (Optional)
    │
    ├─ Update UI immediately
    │
    ▼
Backend API
    │
    ├─ Success → Keep optimistic update
    │
    ├─ Error → Rollback optimistic update
    │
    ▼
Invalidate Cache → Refetch → Re-render
```

### 3. State Update Flow (Redux Slices)
```
Component
    │
    ├─ dispatch(setCredentials())
    │
    ▼
Redux Slice Reducer
    │
    ├─ Update state immutably
    │
    ▼
Notify Subscribers
    │
    ▼
Re-render Components
```

## State Structure

```typescript
{
  // Redux Slices
  auth: {
    user: User | null,
    accessToken: string | null,
    refreshToken: string | null,
    isAuthenticated: boolean,
    isLoading: boolean
  },
  
  visits: {
    visits: Visit[],
    currentVisit: Visit | null,
    isLoading: boolean
  },
  
  sync: {
    lastSyncedAt: string,
    pendingChanges: number,
    isSyncing: boolean
  },
  
  // RTK Query Cache
  api: {
    queries: {
      'getVisits({"date":"2025-10-04"})': {
        status: 'fulfilled',
        data: [...],
        endpointName: 'getVisits',
        requestId: '...',
        startedTimeStamp: 1234567890,
        fulfilledTimeStamp: 1234567891
      },
      // ... other cached queries
    },
    mutations: {
      // ... mutation states
    },
    provided: {
      Visit: ['LIST', '123', '456'],
      User: ['current']
    },
    subscriptions: {
      // ... active subscriptions
    }
  }
}
```

## API Endpoints

### Authentication
| Endpoint | Method | Hook | Description |
|----------|--------|------|-------------|
| `/auth/login` | POST | `useLoginMutation` | User login |
| `/auth/refresh` | POST | `useRefreshTokenMutation` | Refresh token |
| `/auth/logout` | POST | `useLogoutMutation` | User logout |

### Visits
| Endpoint | Method | Hook | Description |
|----------|--------|------|-------------|
| `/visits` | GET | `useGetVisitsQuery` | List visits |
| `/visits/:id` | GET | `useGetVisitByIdQuery` | Get single visit |
| `/visits/:id/check-in` | POST | `useCheckInMutation` | Check in to visit |
| `/visits/:id/documentation` | PUT | `useUpdateDocumentationMutation` | Update documentation |
| `/visits/:id/complete` | POST | `useCompleteVisitMutation` | Complete visit |

### Sync
| Endpoint | Method | Hook | Description |
|----------|--------|------|-------------|
| `/sync/pull` | POST | `useSyncPullMutation` | Pull server changes |
| `/sync/push` | POST | `useSyncPushMutation` | Push local changes |

## Cache Management

### Tag System
```typescript
tagTypes: ['Visit', 'User', 'Client', 'Sync']
```

### Invalidation Rules
- **Login/Logout** → Invalidates `User`, `Visit`
- **Check-in** → Invalidates specific `Visit`
- **Update Documentation** → Invalidates specific `Visit`
- **Complete Visit** → Invalidates specific `Visit` + `LIST`
- **Sync Pull** → Invalidates `Visit`, `Sync`
- **Sync Push** → Invalidates `Sync`

### Cache Behavior
- **Automatic Refetch**: On focus, reconnect
- **Deduplication**: Multiple identical requests → single API call
- **Stale Time**: Configurable per endpoint
- **Cache Time**: Data persists for 60s after last subscriber

## Performance Features

### 1. Request Deduplication
Multiple components requesting same data → Single API call

### 2. Optimistic Updates
UI updates immediately, rolls back on error

### 3. Automatic Refetching
- On window focus
- On network reconnect
- On cache invalidation

### 4. Selective Re-renders
Components only re-render when their selected state changes

### 5. Normalized Cache
Entities stored by ID, preventing duplication

## Integration Patterns

### Pattern 1: Simple Query
```typescript
const { data, isLoading, error } = useGetVisitsQuery();
```

### Pattern 2: Query with Parameters
```typescript
const { data } = useGetVisitsQuery({ 
  date: '2025-10-04',
  status: 'scheduled' 
});
```

### Pattern 3: Mutation with Error Handling
```typescript
const [updateDoc, { isLoading }] = useUpdateDocumentationMutation();

try {
  await updateDoc({ id, data }).unwrap();
} catch (error) {
  // Handle error
}
```

### Pattern 4: Accessing Redux State
```typescript
const user = useAppSelector(state => state.auth.user);
const dispatch = useAppDispatch();
```

### Pattern 5: Conditional Query
```typescript
const { data } = useGetVisitsQuery(undefined, {
  skip: !isOnline,
  refetchOnFocus: true
});
```

## Offline Strategy

### Current Implementation
1. **RTK Query** handles online API calls
2. **Redux Slices** maintain local state
3. **Sync Slice** tracks pending changes

### Future Enhancement (Phase O)
1. **Watermelon DB** for persistent offline storage
2. **Sync Queue** for offline mutations
3. **Conflict Resolution** for sync conflicts
4. **Background Sync** for automatic synchronization

## Testing Strategy

### Unit Tests
- Test reducers with actions
- Test selectors
- Test API endpoint configurations

### Integration Tests
- Test complete flows
- Test cache invalidation
- Test optimistic updates

### Component Tests
```typescript
import { renderWithProviders } from '@/test-utils';

test('renders component', () => {
  const { getByText } = renderWithProviders(<Component />, {
    preloadedState: { auth: mockAuthState }
  });
});
```

## Best Practices

### ✅ Do
- Use typed hooks (`useAppDispatch`, `useAppSelector`)
- Handle loading and error states
- Use optimistic updates for better UX
- Leverage automatic refetching
- Use tag-based cache invalidation

### ❌ Don't
- Don't use plain `useDispatch`/`useSelector`
- Don't ignore error states
- Don't manually manage cache
- Don't fetch data in `useEffect` (use RTK Query)
- Don't mutate state directly

## File Organization

```
mobile/src/store/
├── index.ts                    # Store configuration
├── hooks.ts                    # Typed hooks
├── README.md                   # Documentation
├── IMPLEMENTATION_SUMMARY.md   # Implementation details
├── INTEGRATION_EXAMPLES.tsx    # Usage examples
├── api/
│   ├── baseApi.ts             # Base configuration
│   ├── authApi.ts             # Auth endpoints
│   ├── visitApi.ts            # Visit endpoints
│   ├── syncApi.ts             # Sync endpoints
│   └── index.ts               # Exports
└── slices/
    ├── authSlice.ts           # Auth state
    ├── visitSlice.ts          # Visit state
    └── syncSlice.ts           # Sync state
```

## Dependencies

```json
{
  "@reduxjs/toolkit": "^2.5.0",
  "react-redux": "^9.2.0",
  "@react-native-async-storage/async-storage": "^2.1.0"
}
```

## Configuration

### Environment
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://api.berthcare.ca';
```

### Store Options
- Serializable check enabled
- RTK Query middleware added
- Auto-refetch listeners enabled

## Migration Path

### From Axios to RTK Query
1. ✅ Keep existing `api.service.ts` for now
2. ✅ Use RTK Query for new features
3. 🔄 Gradually migrate existing calls
4. 🔄 Remove `api.service.ts` when complete

## Success Metrics

✅ Type-safe state management
✅ Automatic caching and refetching
✅ Optimistic updates
✅ Reduced boilerplate
✅ Better developer experience
✅ Improved performance

## Next Steps

### Phase F (Current)
- Integrate with Login screen (F10-F11)
- Integrate with Schedule screen (F15-F16)
- Integrate with Visit Documentation (F26-F29)

### Phase O (Offline)
- Watermelon DB integration
- Offline mutation queue
- Background sync
- Conflict resolution

## Resources

- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [RTK Query Docs](https://redux-toolkit.js.org/rtk-query/overview)
- [React Redux Hooks](https://react-redux.js.org/api/hooks)
- Internal: `mobile/src/store/README.md`
- Internal: `mobile/src/store/INTEGRATION_EXAMPLES.tsx`

---

**Status**: ✅ Complete and Ready for Integration
**Last Updated**: 2025-10-04

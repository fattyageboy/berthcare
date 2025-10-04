# Redux Store Configuration

This directory contains the Redux Toolkit store configuration with RTK Query for API calls.

## Architecture

### Store Structure
```
store/
├── index.ts              # Store configuration
├── hooks.ts              # Typed Redux hooks
├── api/                  # RTK Query API endpoints
│   ├── baseApi.ts        # Base API configuration
│   ├── authApi.ts        # Authentication endpoints
│   ├── visitApi.ts       # Visit management endpoints
│   └── syncApi.ts        # Sync endpoints
└── slices/               # Redux slices
    ├── authSlice.ts      # Auth state
    ├── visitSlice.ts     # Visit state
    └── syncSlice.ts      # Sync state
```

## RTK Query Setup

### Base API Configuration
The `baseApi` is configured with:
- Automatic token injection from Redux state or AsyncStorage
- Tag-based cache invalidation
- Optimistic updates support
- Automatic refetch on focus/reconnect

### API Endpoints

#### Auth API (`authApi`)
- `useLoginMutation` - User login
- `useRefreshTokenMutation` - Token refresh
- `useLogoutMutation` - User logout

#### Visit API (`visitApi`)
- `useGetVisitsQuery` - Fetch visits list
- `useGetVisitByIdQuery` - Fetch single visit
- `useCheckInMutation` - Check in to visit
- `useUpdateDocumentationMutation` - Update visit documentation (with optimistic updates)
- `useCompleteVisitMutation` - Complete visit

#### Sync API (`syncApi`)
- `useSyncPullMutation` - Pull changes from server
- `useSyncPushMutation` - Push local changes to server

## Usage Examples

### Using RTK Query Hooks

```typescript
import { useGetVisitsQuery, useCheckInMutation } from '@/store/api';

function ScheduleScreen() {
  // Query with automatic caching and refetching
  const { data, isLoading, error, refetch } = useGetVisitsQuery({ 
    date: '2025-10-04' 
  });

  // Mutation with loading states
  const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();

  const handleCheckIn = async (visitId: string) => {
    try {
      await checkIn({
        id: visitId,
        data: {
          latitude: 43.6532,
          longitude: -79.3832,
          timestamp: new Date().toISOString(),
        },
      }).unwrap();
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  return (
    // Component JSX
  );
}
```

### Using Redux Slices

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, logout } from '@/store/slices/authSlice';

function LoginScreen() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);

  const handleLogin = async (credentials) => {
    const response = await loginMutation(credentials);
    dispatch(setCredentials(response.data));
  };

  return (
    // Component JSX
  );
}
```

### Optimistic Updates

The `updateDocumentation` mutation includes optimistic updates:

```typescript
const [updateDoc] = useUpdateDocumentationMutation();

// Updates UI immediately, rolls back on error
await updateDoc({
  id: visitId,
  data: { notes: 'Patient doing well' },
});
```

## Cache Management

### Tag-Based Invalidation
RTK Query uses tags to manage cache invalidation:

- `Visit` - Individual visit data
- `User` - User data
- `Client` - Client data
- `Sync` - Sync state

When a mutation invalidates a tag, all queries with that tag automatically refetch.

### Manual Cache Updates

```typescript
import { baseApi } from '@/store/api';

// Manually update cache
dispatch(
  baseApi.util.updateQueryData('getVisitById', visitId, draft => {
    draft.data.status = 'completed';
  })
);

// Invalidate specific tags
dispatch(baseApi.util.invalidateTags(['Visit']));
```

## Offline Support

The store is designed to work with offline sync:

1. **Slices** maintain local state for offline operations
2. **RTK Query** handles API calls when online
3. **Sync slice** tracks pending changes and sync status

### Offline Flow
1. User makes changes → Update local slice
2. Track change in sync slice
3. When online → Use sync API to push changes
4. Pull latest data from server
5. Update local state and clear pending changes

## Best Practices

### 1. Use Typed Hooks
Always use `useAppDispatch` and `useAppSelector` instead of plain hooks:

```typescript
// ✅ Good
import { useAppSelector } from '@/store/hooks';
const user = useAppSelector(state => state.auth.user);

// ❌ Bad
import { useSelector } from 'react-redux';
const user = useSelector(state => state.auth.user); // No type safety
```

### 2. Handle Loading and Error States

```typescript
const { data, isLoading, error } = useGetVisitsQuery();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;

return <VisitList visits={data.data} />;
```

### 3. Use Mutations with Error Handling

```typescript
const [updateVisit, { isLoading }] = useUpdateDocumentationMutation();

const handleUpdate = async (data) => {
  try {
    await updateVisit({ id: visitId, data }).unwrap();
    // Success handling
  } catch (error) {
    // Error handling
    console.error('Update failed:', error);
  }
};
```

### 4. Leverage Automatic Refetching

```typescript
// Refetch on focus
const { data } = useGetVisitsQuery(undefined, {
  refetchOnFocus: true,
  refetchOnReconnect: true,
});

// Polling
const { data } = useGetVisitsQuery(undefined, {
  pollingInterval: 30000, // Refetch every 30s
});
```

## Performance Optimization

### Selective Subscriptions
Only subscribe to the data you need:

```typescript
// ✅ Good - Selective
const userName = useAppSelector(state => state.auth.user?.name);

// ❌ Bad - Causes unnecessary re-renders
const auth = useAppSelector(state => state.auth);
const userName = auth.user?.name;
```

### Memoized Selectors
For complex derived state, use memoized selectors:

```typescript
import { createSelector } from '@reduxjs/toolkit';

const selectCompletedVisits = createSelector(
  (state: RootState) => state.visits.visits,
  visits => visits.filter(v => v.status === 'completed')
);
```

## Testing

### Testing Components with Redux

```typescript
import { renderWithProviders } from '@/test-utils';

test('renders visit list', () => {
  const { getByText } = renderWithProviders(<ScheduleScreen />, {
    preloadedState: {
      visits: {
        visits: [mockVisit],
        currentVisit: null,
        isLoading: false,
      },
    },
  });
  
  expect(getByText('Patient Name')).toBeInTheDocument();
});
```

### Testing RTK Query Hooks

```typescript
import { setupApiStore } from '@/test-utils';

test('fetches visits', async () => {
  const storeRef = setupApiStore(baseApi);
  
  await storeRef.store.dispatch(
    visitApi.endpoints.getVisits.initiate({})
  );
  
  const state = storeRef.store.getState();
  expect(state.api.queries).toBeDefined();
});
```

## Migration Notes

### From Axios to RTK Query
The existing `api.service.ts` can coexist with RTK Query during migration:
- Use RTK Query for new features
- Gradually migrate existing API calls
- Remove `api.service.ts` once migration is complete

### Token Management
RTK Query automatically handles token injection via `prepareHeaders`:
- Checks Redux state first
- Falls back to AsyncStorage
- No manual header management needed

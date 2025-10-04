# Redux Quick Reference Guide

## Import Statements

```typescript
// Hooks
import { useAppDispatch, useAppSelector } from '@/store/hooks';

// API Hooks
import {
  useLoginMutation,
  useGetVisitsQuery,
  useCheckInMutation,
  useUpdateDocumentationMutation,
} from '@/store/api';

// Actions
import { setCredentials, logout } from '@/store/slices/authSlice';
import { setCurrentVisit, updateVisit } from '@/store/slices/visitSlice';
import { startSync, completeSync } from '@/store/slices/syncSlice';
```

## Common Patterns

### 1. Fetch Data (Query)
```typescript
const { data, isLoading, error, refetch } = useGetVisitsQuery({
  date: '2025-10-04'
});

if (isLoading) return <Loading />;
if (error) return <Error />;
return <VisitList visits={data.data} />;
```

### 2. Mutate Data
```typescript
const [checkIn, { isLoading }] = useCheckInMutation();

const handleCheckIn = async () => {
  try {
    await checkIn({ id: visitId, data }).unwrap();
    // Success
  } catch (error) {
    // Error
  }
};
```

### 3. Access State
```typescript
const user = useAppSelector(state => state.auth.user);
const visits = useAppSelector(state => state.visits.visits);
const isSyncing = useAppSelector(state => state.sync.isSyncing);
```

### 4. Dispatch Actions
```typescript
const dispatch = useAppDispatch();

dispatch(setCredentials({ user, accessToken, refreshToken }));
dispatch(logout());
dispatch(setCurrentVisit(visit));
```

## API Hooks Reference

### Auth
```typescript
useLoginMutation()          // Login user
useRefreshTokenMutation()   // Refresh token
useLogoutMutation()         // Logout user
```

### Visits
```typescript
useGetVisitsQuery(params)              // List visits
useGetVisitByIdQuery(id)               // Get visit
useCheckInMutation()                   // Check in
useUpdateDocumentationMutation()       // Update docs
useCompleteVisitMutation()             // Complete visit
```

### Sync
```typescript
useSyncPullMutation()       // Pull changes
useSyncPushMutation()       // Push changes
```

## Query Options

```typescript
useGetVisitsQuery(params, {
  skip: !isOnline,              // Skip when offline
  refetchOnFocus: true,         // Refetch on focus
  refetchOnReconnect: true,     // Refetch on reconnect
  pollingInterval: 30000,       // Poll every 30s
});
```

## Error Handling

```typescript
const { data, error } = useGetVisitsQuery();

if (error) {
  if ('status' in error) {
    // HTTP error
    console.error(error.status, error.data);
  } else {
    // Network error
    console.error(error.message);
  }
}
```

## Loading States

```typescript
const [mutation, { isLoading, isSuccess, isError }] = useMutation();

<Button 
  disabled={isLoading}
  title={isLoading ? 'Saving...' : 'Save'}
/>
```

## Optimistic Updates

```typescript
// Automatically handled in updateDocumentation
const [updateDoc] = useUpdateDocumentationMutation();

// UI updates immediately, rolls back on error
await updateDoc({ id, data });
```

## Cache Invalidation

```typescript
// Automatic via tags
useCheckInMutation()  // Invalidates Visit tag

// Manual
import { baseApi } from '@/store/api';
dispatch(baseApi.util.invalidateTags(['Visit']));
```

## Selectors

```typescript
// Simple
const user = useAppSelector(state => state.auth.user);

// Derived
const completedVisits = useAppSelector(state => 
  state.visits.visits.filter(v => v.status === 'completed')
);

// Memoized (for expensive computations)
import { createSelector } from '@reduxjs/toolkit';

const selectCompletedVisits = createSelector(
  state => state.visits.visits,
  visits => visits.filter(v => v.status === 'completed')
);
```

## TypeScript Types

```typescript
import type { RootState, AppDispatch } from '@/store';
import type { User, Visit } from '@/types';

// In component props
interface Props {
  visitId: string;
}

// For selectors
const selectUser = (state: RootState) => state.auth.user;
```

## Testing

```typescript
import { renderWithProviders } from '@/test-utils';

test('component', () => {
  const { getByText } = renderWithProviders(<Component />, {
    preloadedState: {
      auth: { user: mockUser, isAuthenticated: true }
    }
  });
});
```

## Common Mistakes

### ❌ Don't
```typescript
// Don't use plain hooks
import { useSelector } from 'react-redux';

// Don't mutate state
state.user.name = 'New Name';

// Don't fetch in useEffect
useEffect(() => {
  fetch('/api/visits').then(...);
}, []);
```

### ✅ Do
```typescript
// Use typed hooks
import { useAppSelector } from '@/store/hooks';

// Use RTK Query
const { data } = useGetVisitsQuery();

// Dispatch actions
dispatch(updateVisit(newVisit));
```

## Performance Tips

```typescript
// 1. Selective subscriptions
const userName = useAppSelector(state => state.auth.user?.name);

// 2. Skip unnecessary queries
const { data } = useQuery(params, { skip: !shouldFetch });

// 3. Use memoized selectors
const memoizedValue = useMemo(() => expensiveCalc(data), [data]);

// 4. Debounce mutations
const debouncedUpdate = useMemo(
  () => debounce(updateDoc, 500),
  []
);
```

## Debugging

```typescript
// Log state
console.log(store.getState());

// Log cache
console.log(store.getState().api);

// Redux DevTools
// Automatically enabled in development
```

## Environment

```typescript
// API URL
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://api.berthcare.ca';
```

## Cheat Sheet

| Task | Code |
|------|------|
| Fetch data | `useGetVisitsQuery()` |
| Mutate data | `useCheckInMutation()` |
| Get state | `useAppSelector(state => state.auth)` |
| Update state | `dispatch(setCredentials(data))` |
| Handle loading | `if (isLoading) return <Loading />` |
| Handle error | `if (error) return <Error />` |
| Refetch | `refetch()` |
| Skip query | `{ skip: true }` |
| Poll | `{ pollingInterval: 30000 }` |

---

**Quick Links**
- Full Documentation: `mobile/src/store/README.md`
- Examples: `mobile/src/store/INTEGRATION_EXAMPLES.tsx`
- Architecture: `mobile/REDUX_ARCHITECTURE.md`

/* eslint-disable no-console, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * Redux Integration Examples
 *
 * These examples show how to integrate RTK Query and Redux slices
 * into React Native screens and components.
 */

import React, { useState } from 'react';
import { View, Text, Button, FlatList, ActivityIndicator } from 'react-native';
import { useAppDispatch, useAppSelector } from './hooks';
import { setCredentials, logout } from './slices/authSlice';
import { setCurrentVisit } from './slices/visitSlice';
import {
  useLoginMutation,
  useGetVisitsQuery,
  useCheckInMutation,
  useUpdateDocumentationMutation,
} from './api';

// ============================================================================
// Example 1: Login Screen with Auth API
// ============================================================================

export function LoginScreenExample() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();

  // RTK Query mutation hook
  const [login, { isLoading, error }] = useLoginMutation();

  const handleLogin = async () => {
    try {
      // Call API and unwrap the result
      const result = await login({ email, password }).unwrap();

      // Update Redux state with credentials
      dispatch(setCredentials(result.data));

      // Navigate to home screen
      console.log('Login successful!');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <View>
      {/* Login form UI */}
      <Button title="Login" onPress={handleLogin} disabled={isLoading} />
      {isLoading && <ActivityIndicator />}
      {error && <Text>Error: {JSON.stringify(error)}</Text>}
    </View>
  );
}

// ============================================================================
// Example 2: Schedule Screen with Visit Query
// ============================================================================

export function ScheduleScreenExample() {
  const today = new Date().toISOString().split('T')[0];

  // RTK Query automatically handles caching, loading, and refetching
  const { data, isLoading, error, refetch } = useGetVisitsQuery({
    date: today,
    status: 'scheduled',
  });

  // Pull-to-refresh handler
  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error loading visits</Text>;
  }

  return (
    <FlatList
      data={data?.data || []}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View>
          <Text>{item.clientId}</Text>
          <Text>{item.status}</Text>
        </View>
      )}
      onRefresh={handleRefresh}
      refreshing={isLoading}
    />
  );
}

// ============================================================================
// Example 3: Visit Check-In with Mutation
// ============================================================================

export function CheckInButtonExample({ visitId }: { visitId: string }) {
  const dispatch = useAppDispatch();
  const [checkIn, { isLoading }] = useCheckInMutation();

  const handleCheckIn = async () => {
    try {
      // Get current location (mock for example)
      const latitude = 43.6532;
      const longitude = -79.3832;

      // Call check-in API
      const result = await checkIn({
        id: visitId,
        data: {
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        },
      }).unwrap();

      // Update current visit in Redux
      dispatch(setCurrentVisit(result.data));

      console.log('Check-in successful!');
    } catch (err) {
      console.error('Check-in failed:', err);
    }
  };

  return (
    <Button
      title={isLoading ? 'Checking in...' : 'Check In'}
      onPress={handleCheckIn}
      disabled={isLoading}
    />
  );
}

// ============================================================================
// Example 4: Visit Documentation with Optimistic Updates
// ============================================================================

export function VisitDocumentationExample({ visitId }: { visitId: string }) {
  const [notes, setNotes] = useState('');

  // Optimistic updates configured in visitApi.ts
  const [updateDoc, { isLoading }] = useUpdateDocumentationMutation();

  const handleSave = async () => {
    try {
      // UI updates immediately, rolls back on error
      await updateDoc({
        id: visitId,
        data: {
          notes,
          assessment: 'Patient stable',
          careActivities: ['medication', 'vitals'],
        },
      }).unwrap();

      console.log('Documentation saved!');
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  // Auto-save every 30 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (notes) {
        handleSave();
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [notes]);

  return (
    <View>
      {/* Documentation form UI */}
      <Button title="Save" onPress={handleSave} disabled={isLoading} />
    </View>
  );
}

// ============================================================================
// Example 5: Using Redux State with Typed Hooks
// ============================================================================

export function UserProfileExample() {
  // Type-safe state access
  const user = useAppSelector(state => state.auth.user);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const pendingChanges = useAppSelector(state => state.sync.pendingChanges);
  const isSyncing = useAppSelector(state => state.sync.isSyncing);

  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!isAuthenticated || !user) {
    return <Text>Not logged in</Text>;
  }

  return (
    <View>
      <Text>Welcome, {user.name}</Text>
      <Text>Role: {user.role}</Text>
      <Text>Email: {user.email}</Text>

      {pendingChanges > 0 && <Text>Pending changes: {pendingChanges}</Text>}

      {isSyncing && <Text>Syncing...</Text>}

      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

// ============================================================================
// Example 6: Sync Status Indicator
// ============================================================================

export function SyncStatusExample() {
  const { lastSyncedAt, pendingChanges, isSyncing } = useAppSelector(state => state.sync);

  const getStatusColor = () => {
    if (isSyncing) return 'blue';
    if (pendingChanges > 0) return 'orange';
    return 'green';
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (pendingChanges > 0) return `${pendingChanges} pending`;
    if (lastSyncedAt) return `Synced ${formatTime(lastSyncedAt)}`;
    return 'Not synced';
  };

  return (
    <View style={{ backgroundColor: getStatusColor() }}>
      <Text>{getStatusText()}</Text>
    </View>
  );
}

// ============================================================================
// Example 7: Conditional Queries (Skip when offline)
// ============================================================================

export function ConditionalQueryExample() {
  const isOnline = true; // Get from network state

  // Skip query when offline
  const { data } = useGetVisitsQuery(undefined, {
    skip: !isOnline,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  return (
    <View>
      {!isOnline && <Text>Offline - showing cached data</Text>}
      {/* Render visits */}
    </View>
  );
}

// ============================================================================
// Example 8: Polling for Real-Time Updates
// ============================================================================

export function PollingExample() {
  // Poll every 30 seconds for updates
  const { data } = useGetVisitsQuery(undefined, {
    pollingInterval: 30000,
  });

  return <View>{/* Render visits - automatically updates every 30s */}</View>;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// Testing Example
// ============================================================================

/**
 * Example test for a component using Redux
 *
 * import { renderWithProviders } from '@/test-utils';
 *
 * test('renders user profile', () => {
 *   const { getByText } = renderWithProviders(<UserProfileExample />, {
 *     preloadedState: {
 *       auth: {
 *         user: { name: 'John Doe', email: 'john@example.com', role: 'nurse' },
 *         isAuthenticated: true,
 *       },
 *     },
 *   });
 *
 *   expect(getByText('Welcome, John Doe')).toBeTruthy();
 * });
 */

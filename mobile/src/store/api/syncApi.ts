// Sync API endpoints
import { baseApi } from './baseApi';
import type { ApiResponse } from '../../types';

interface SyncPullRequest {
  lastSyncTimestamp: string;
  entityTypes?: string[];
}

interface SyncPullResponse {
  visits: any[];
  clients: any[];
  users: any[];
  timestamp: string;
}

interface SyncPushRequest {
  changes: Array<{
    entityType: string;
    entityId: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
    timestamp: string;
  }>;
}

interface SyncPushResponse {
  processed: number;
  conflicts: Array<{
    entityType: string;
    entityId: string;
    reason: string;
  }>;
  timestamp: string;
}

export const syncApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    syncPull: builder.mutation<ApiResponse<SyncPullResponse>, SyncPullRequest>({
      query: data => ({
        url: '/sync/pull',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Visit', 'Sync'],
    }),
    syncPush: builder.mutation<ApiResponse<SyncPushResponse>, SyncPushRequest>({
      query: data => ({
        url: '/sync/push',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Sync'],
    }),
  }),
});

export const { useSyncPullMutation, useSyncPushMutation } = syncApi;

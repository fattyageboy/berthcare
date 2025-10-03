/**
 * WebSocket Types
 * Type definitions for real-time sync events
 */

import { EntityType, SyncOperation } from './types';

export interface WebSocketUser {
  userId: string;
  socketId: string;
  organizationId?: string;
  connectedAt: Date;
}

export interface EntityChangeEvent {
  event: 'entity:changed';
  data: {
    entity_type: EntityType;
    entity_id: string;
    operation: SyncOperation;
    data: Record<string, unknown>;
    updated_at: string;
    user_id: string;
  };
}

export interface SyncRequestEvent {
  event: 'sync:request';
  data: {
    entity_types: EntityType[];
    last_sync_timestamp: string;
  };
}

export interface SyncCompleteEvent {
  event: 'sync:complete';
  data: {
    sync_timestamp: string;
    changes_count: number;
  };
}

export interface ConnectionEvent {
  event: 'connection:established';
  data: {
    user_id: string;
    timestamp: string;
  };
}

export interface ErrorEvent {
  event: 'error';
  data: {
    message: string;
    code?: string;
  };
}

export type WebSocketEvent =
  | EntityChangeEvent
  | SyncRequestEvent
  | SyncCompleteEvent
  | ConnectionEvent
  | ErrorEvent;

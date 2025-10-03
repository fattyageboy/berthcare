/**
 * Sync Service Types
 * Type definitions for offline synchronization
 */

export type SyncOperation = 'create' | 'update' | 'delete';
export type EntityType = 'visits' | 'clients' | 'care_plans' | 'family_members';
export type ResolutionStrategy = 'last_write_wins' | 'manual_review';

export interface SyncLogEntry {
  id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id: string;
  operation: SyncOperation;
  local_timestamp: string;
  server_timestamp: string;
  conflict_resolved: boolean;
  resolution_strategy: ResolutionStrategy | null;
  created_at: string;
}

export interface PullRequest {
  last_sync_timestamp: string;
  entity_types: EntityType[];
}

export interface EntityChange {
  id: string;
  operation: SyncOperation;
  data: Record<string, unknown>;
  updated_at: string;
}

export interface PullResponse {
  changes: Record<EntityType, EntityChange[]>;
  sync_timestamp: string;
  has_more: boolean;
}

export interface PushChange {
  entity_type: EntityType;
  entity_id: string;
  operation: SyncOperation;
  data: Record<string, unknown>;
  local_timestamp: string;
}

export interface PushRequest {
  changes: PushChange[];
}

export interface PushResult {
  entity_id: string;
  status: 'success' | 'conflict' | 'error';
  server_timestamp: string;
  conflicts: ConflictInfo | null;
  error?: string;
}

export interface PushResponse {
  results: PushResult[];
  sync_timestamp: string;
}

export interface ConflictInfo {
  detected: boolean;
  resolution_strategy: ResolutionStrategy;
  server_version: Record<string, unknown> | null;
  client_version: Record<string, unknown>;
}

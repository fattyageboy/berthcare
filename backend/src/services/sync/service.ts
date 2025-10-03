import { syncRepository } from './repository';
import { websocketService } from './websocket.service';
import {
  PullRequest,
  PullResponse,
  PushRequest,
  PushResponse,
  PushResult,
  EntityType,
  EntityChange,
  ConflictInfo,
} from './types';

/**
 * Sync Service
 * Business logic for offline synchronization
 */

export class SyncService {
  /**
   * Pull changes from server since last sync
   */
  async pullChanges(userId: string, request: PullRequest): Promise<PullResponse> {
    const { last_sync_timestamp, entity_types } = request;

    const changes: Record<EntityType, EntityChange[]> = {
      visits: [],
      clients: [],
      care_plans: [],
      family_members: [],
    };

    // Fetch changes for each requested entity type
    for (const entityType of entity_types) {
      const entityChanges = await syncRepository.getChangesSince(
        entityType,
        last_sync_timestamp,
        userId
      );
      changes[entityType] = entityChanges;
    }

    // Calculate total changes
    const totalChanges = Object.values(changes).reduce((sum, arr) => sum + arr.length, 0);

    return {
      changes,
      sync_timestamp: new Date().toISOString(),
      has_more: totalChanges >= 100, // Pagination threshold
    };
  }

  /**
   * Push local changes to server
   */
  async pushChanges(userId: string, request: PushRequest): Promise<PushResponse> {
    const results: PushResult[] = [];

    for (const change of request.changes) {
      try {
        const result = await this.processChange(userId, change);
        results.push(result);
      } catch (error) {
        results.push({
          entity_id: change.entity_id,
          status: 'error',
          server_timestamp: new Date().toISOString(),
          conflicts: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      results,
      sync_timestamp: new Date().toISOString(),
    };
  }

  /**
   * Process individual change with conflict detection
   */
  private async processChange(
    userId: string,
    change: {
      entity_type: EntityType;
      entity_id: string;
      operation: 'create' | 'update' | 'delete';
      data: Record<string, unknown>;
      local_timestamp: string;
    }
  ): Promise<PushResult> {
    const { entity_type, entity_id, operation, data, local_timestamp } = change;

    // Check for conflicts
    const hasConflict = await syncRepository.hasConflict(entity_type, entity_id, local_timestamp);

    let conflictInfo: ConflictInfo | null = null;
    let resolutionStrategy: 'last_write_wins' | 'manual_review' | null = null;

    if (hasConflict) {
      // Get server version for conflict info
      const serverVersion = await syncRepository.getEntity(entity_type, entity_id);

      conflictInfo = {
        detected: true,
        resolution_strategy: 'last_write_wins',
        server_version: serverVersion,
        client_version: data,
      };

      resolutionStrategy = 'last_write_wins';

      // Apply last-write-wins strategy
      // Server accepts the client's change regardless of conflict
    }

    // Apply the change
    const updatedEntity = await syncRepository.upsertEntity(
      entity_type,
      entity_id,
      data,
      operation
    );

    // Log the sync operation
    const serverTimestamp = new Date().toISOString();
    await syncRepository.logSync(
      userId,
      entity_type,
      entity_id,
      operation,
      local_timestamp,
      hasConflict,
      resolutionStrategy
    );

    // Broadcast change to connected clients via WebSocket
    const organizationId = (data.organization_id as string) || undefined;
    websocketService.broadcastEntityChange(
      entity_type,
      entity_id,
      operation,
      updatedEntity,
      userId,
      organizationId
    );

    return {
      entity_id,
      status: hasConflict ? 'conflict' : 'success',
      server_timestamp: serverTimestamp,
      conflicts: conflictInfo,
    };
  }
}

export const syncService = new SyncService();

import { database } from '../../config';
import { QueryResult } from 'pg';
import { SyncLogEntry, EntityType, SyncOperation, ResolutionStrategy, EntityChange } from './types';

/**
 * Sync Repository
 * Data access layer for synchronization operations
 */

export class SyncRepository {
  /**
   * Get changes for entities since last sync timestamp
   */
  async getChangesSince(
    entityType: EntityType,
    lastSyncTimestamp: string,
    userId: string
  ): Promise<EntityChange[]> {
    // Build query based on entity type
    let query: string;
    let params: (string | number)[];

    if (entityType === 'visits') {
      // Visits are user-specific
      query = `
        SELECT *
        FROM ${entityType}
        WHERE updated_at > $1
          AND user_id = $2
        ORDER BY updated_at ASC
        LIMIT 100
      `;
      params = [lastSyncTimestamp, userId];
    } else {
      // Clients, care_plans, family_members are organization-wide
      // For now, return all changes (will add organization filtering later)
      query = `
        SELECT *
        FROM ${entityType}
        WHERE updated_at > $1
        ORDER BY updated_at ASC
        LIMIT 100
      `;
      params = [lastSyncTimestamp];
    }

    const result: QueryResult = await database.query(query, params);

    return result.rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      operation: this.determineOperation(row),
      data: row,
      updated_at: row.updated_at as string,
    }));
  }

  /**
   * Determine operation type based on row data
   */
  private determineOperation(row: Record<string, unknown>): SyncOperation {
    // If deleted_at exists and is not null, it's a delete operation
    if (row.deleted_at) {
      return 'delete';
    }
    // For now, treat all others as updates (create vs update distinction requires additional tracking)
    return 'update';
  }

  /**
   * Get entity by ID and type
   */
  async getEntity(
    entityType: EntityType,
    entityId: string
  ): Promise<Record<string, unknown> | null> {
    const query = `
      SELECT * FROM ${entityType}
      WHERE id = $1
    `;

    const result: QueryResult = await database.query(query, [entityId]);
    return (result.rows[0] as Record<string, unknown>) || null;
  }

  /**
   * Create or update entity
   */
  async upsertEntity(
    entityType: EntityType,
    entityId: string,
    data: Record<string, unknown>,
    operation: SyncOperation
  ): Promise<Record<string, unknown>> {
    const now = new Date().toISOString();

    if (operation === 'create') {
      return this.createEntity(entityType, {
        ...data,
        id: entityId,
        created_at: now,
        updated_at: now,
      });
    } else if (operation === 'update') {
      return this.updateEntity(entityType, entityId, { ...data, updated_at: now });
    } else {
      throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  /**
   * Create new entity
   */
  private async createEntity(
    entityType: EntityType,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${entityType} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result: QueryResult = await database.query(query, values);
    return result.rows[0] as Record<string, unknown>;
  }

  /**
   * Update existing entity
   */
  private async updateEntity(
    entityType: EntityType,
    entityId: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const columns = Object.keys(data).filter((key) => key !== 'id');
    const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ');
    const values = columns.map((col) => data[col]);

    const query = `
      UPDATE ${entityType}
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    const result: QueryResult = await database.query(query, [entityId, ...values]);
    return result.rows[0] as Record<string, unknown>;
  }

  /**
   * Log sync operation
   */
  async logSync(
    userId: string,
    entityType: EntityType,
    entityId: string,
    operation: SyncOperation,
    localTimestamp: string,
    conflictResolved: boolean,
    resolutionStrategy: ResolutionStrategy | null
  ): Promise<SyncLogEntry> {
    const query = `
      INSERT INTO sync_log (
        user_id,
        entity_type,
        entity_id,
        operation,
        local_timestamp,
        conflict_resolved,
        resolution_strategy
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result: QueryResult = await database.query(query, [
      userId,
      entityType,
      entityId,
      operation,
      localTimestamp,
      conflictResolved,
      resolutionStrategy,
    ]);

    return result.rows[0] as SyncLogEntry;
  }

  /**
   * Check for conflicts
   * Returns true if server version is newer than local timestamp
   */
  async hasConflict(
    entityType: EntityType,
    entityId: string,
    localTimestamp: string
  ): Promise<boolean> {
    const query = `
      SELECT updated_at
      FROM ${entityType}
      WHERE id = $1
    `;

    const result: QueryResult = await database.query(query, [entityId]);

    if (result.rows.length === 0) {
      return false; // No conflict if entity doesn't exist
    }

    const row = result.rows[0] as { updated_at: string };
    const serverUpdatedAt = new Date(row.updated_at);
    const clientUpdatedAt = new Date(localTimestamp);

    // Conflict exists if server version is newer than client's local timestamp
    return serverUpdatedAt > clientUpdatedAt;
  }

  /**
   * Get last sync timestamp for user
   */
  async getLastSyncTimestamp(userId: string): Promise<string | null> {
    const query = `
      SELECT MAX(server_timestamp) as last_sync
      FROM sync_log
      WHERE user_id = $1
    `;

    const result: QueryResult = await database.query(query, [userId]);
    const row = result.rows[0] as { last_sync: string | null } | undefined;
    return row?.last_sync || null;
  }
}

export const syncRepository = new SyncRepository();

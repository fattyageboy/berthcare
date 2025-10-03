import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../../shared/utils/logger';
import { WebSocketUser, EntityChangeEvent } from './websocket.types';
import { EntityType, SyncOperation } from './types';

/**
 * WebSocket Service
 * Manages real-time connections and broadcasts entity changes
 */

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, WebSocketUser> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    logger.info('WebSocket server initialized');
  }

  /**
   * Setup event handlers for connections
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', (data: { user_id: string; organization_id?: string }) => {
        this.handleAuthentication(socket, data);
      });

      // Handle sync request
      socket.on('sync:request', (data) => {
        logger.info(`Sync request from ${socket.id}:`, data);
        // Sync requests are handled via HTTP endpoints
        // This event is for notification purposes
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Handle user authentication
   */
  private handleAuthentication(
    socket: Socket,
    data: { user_id: string; organization_id?: string }
  ): void {
    const { user_id, organization_id } = data;

    if (!user_id) {
      socket.emit('error', {
        event: 'error',
        data: { message: 'User ID is required for authentication' },
      });
      socket.disconnect();
      return;
    }

    // Store user connection
    const user: WebSocketUser = {
      userId: user_id,
      socketId: socket.id,
      organizationId: organization_id,
      connectedAt: new Date(),
    };

    this.connectedUsers.set(socket.id, user);

    // Join user-specific room
    void socket.join(`user:${user_id}`);

    // Join organization room if provided
    if (organization_id) {
      void socket.join(`org:${organization_id}`);
    }

    // Send connection confirmation
    socket.emit('connection:established', {
      event: 'connection:established',
      data: {
        user_id,
        timestamp: new Date().toISOString(),
      },
    });

    logger.info(`User authenticated: ${user_id} (socket: ${socket.id})`);
  }

  /**
   * Handle user disconnection
   */
  private handleDisconnection(socket: Socket): void {
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      logger.info(`User disconnected: ${user.userId} (socket: ${socket.id})`);
      this.connectedUsers.delete(socket.id);
    } else {
      logger.info(`Client disconnected: ${socket.id}`);
    }
  }

  /**
   * Broadcast entity change to relevant users
   */
  broadcastEntityChange(
    entityType: EntityType,
    entityId: string,
    operation: SyncOperation,
    data: Record<string, unknown>,
    userId: string,
    organizationId?: string
  ): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized');
      return;
    }

    const event: EntityChangeEvent = {
      event: 'entity:changed',
      data: {
        entity_type: entityType,
        entity_id: entityId,
        operation,
        data,
        updated_at: new Date().toISOString(),
        user_id: userId,
      },
    };

    // Broadcast to user's own devices (except the one that made the change)
    this.io.to(`user:${userId}`).emit('entity:changed', event);

    // For shared entities (clients, care_plans), broadcast to organization
    if (
      organizationId &&
      (entityType === 'clients' || entityType === 'care_plans' || entityType === 'family_members')
    ) {
      this.io.to(`org:${organizationId}`).emit('entity:changed', event);
    }

    logger.info(
      `Broadcasted ${operation} for ${entityType}:${entityId} to user:${userId}${
        organizationId ? ` and org:${organizationId}` : ''
      }`
    );
  }

  /**
   * Broadcast sync complete event to user
   */
  broadcastSyncComplete(userId: string, syncTimestamp: string, changesCount: number): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('sync:complete', {
      event: 'sync:complete',
      data: {
        sync_timestamp: syncTimestamp,
        changes_count: changesCount,
      },
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users for a specific user ID
   */
  getUserConnections(userId: string): WebSocketUser[] {
    return Array.from(this.connectedUsers.values()).filter((user) => user.userId === userId);
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.getUserConnections(userId).length > 0;
  }

  /**
   * Disconnect all clients (for graceful shutdown)
   */
  disconnectAll(): void {
    if (this.io) {
      this.io.disconnectSockets();
      this.connectedUsers.clear();
      logger.info('All WebSocket clients disconnected');
    }
  }

  /**
   * Get WebSocket server instance
   */
  getServer(): SocketIOServer | null {
    return this.io;
  }
}

export const websocketService = new WebSocketService();

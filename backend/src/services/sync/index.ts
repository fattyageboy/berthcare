import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { config } from '../../config';
import { configureSecurity, errorHandler, requestLogger, ServiceStatus } from '../../shared';
import syncRoutes from './routes';
import { websocketService } from './websocket.service';

/**
 * Sync Service
 * Handles offline data synchronization and conflict resolution with real-time updates
 */

const app = express();
const PORT = config.services.sync;

// Create HTTP server for both Express and Socket.io
const httpServer = createServer(app);

// Initialize WebSocket server
websocketService.initialize(httpServer);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
configureSecurity(app);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const healthResponse = {
    status: ServiceStatus.HEALTHY,
    timestamp: new Date().toISOString(),
    service: 'sync-service',
    version: '1.0.0',
    uptime: process.uptime(),
    websocket: {
      connected_users: websocketService.getConnectedUsersCount(),
    },
  };
  res.json(healthResponse);
});

// API routes
app.use('/api/sync', syncRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.error(`Sync service listening on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.error(`WebSocket server ready at ws://localhost:${PORT}/socket.io`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM received, closing connections...');
  websocketService.disconnectAll();
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('Server closed');
    process.exit(0);
  });
});

export default server;
export { syncController } from './controller';
export { syncService } from './service';
export { syncRepository } from './repository';
export { websocketService } from './websocket.service';
export * from './types';
export * from './websocket.types';

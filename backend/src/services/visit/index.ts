import express, { Request, Response } from 'express';
import { config, database } from '../../config';
import {
  configureSecurity,
  errorHandler,
  requestLogger,
  ApiResponse,
  HealthCheckResponse,
  ServiceStatus,
} from '../../shared';
import uploadRoutes from '../file-upload/upload.routes';
import visitRoutes from './routes';

/**
 * Visit Service
 * Handles visit documentation, records, and clinical data management
 */

const app = express();
const PORT = config.services.visit;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
configureSecurity(app);

// Initialize database connection
const initializeConnections = async (): Promise<void> => {
  try {
    await database.connect();
    console.error('Database connection initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    // Don't exit in development, allow service to start
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
};

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const healthResponse: HealthCheckResponse = {
    status: ServiceStatus.HEALTHY,
    timestamp: new Date().toISOString(),
    service: 'visit-service',
    version: '1.0.0',
    uptime: process.uptime(),
  };
  res.json(healthResponse);
});

// API routes
app.use('/api', visitRoutes);

// Legacy endpoint for backward compatibility
app.get('/api/visits-legacy', (_req: Request, res: Response) => {
  const response: ApiResponse<string> = {
    success: true,
    message: 'Visit service is running',
    data: 'Use GET /api/visits with query parameters',
  };
  res.json(response);
});

// File upload routes
app.use('/api/uploads', uploadRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server and initialize connections
const server = app.listen(PORT, () => {
  console.error(`Visit service listening on port ${PORT}`);
  void initializeConnections();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.error('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    void (async () => {
      await database.disconnect();
      console.error('Server closed');
      process.exit(0);
    })();
  });
});

export default server;

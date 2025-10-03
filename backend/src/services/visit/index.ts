import express, { Request, Response } from 'express';
import { config } from '../../config';
import {
  configureSecurity,
  errorHandler,
  requestLogger,
  ApiResponse,
  HealthCheckResponse,
  ServiceStatus,
} from '../../shared';
import uploadRoutes from '../file-upload/upload.routes';

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
app.get('/api/visits', (_req: Request, res: Response) => {
  const response: ApiResponse<string> = {
    success: true,
    message: 'Visit service is running',
    data: 'GET /api/visits endpoint',
  };
  res.json(response);
});

// File upload routes
app.use('/api/uploads', uploadRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.error(`Visit service listening on port ${PORT}`);
});

export default server;

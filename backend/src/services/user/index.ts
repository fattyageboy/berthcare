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

/**
 * User Service
 * Handles user authentication, authorization, and profile management
 */

const app = express();
const PORT = config.services.user;

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
    service: 'user-service',
    version: '1.0.0',
    uptime: process.uptime(),
  };
  res.json(healthResponse);
});

// API routes
app.get('/api/users', (_req: Request, res: Response) => {
  const response: ApiResponse<string> = {
    success: true,
    message: 'User service is running',
    data: 'GET /api/users endpoint',
  };
  res.json(response);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.error(`User service listening on port ${PORT}`);
});

export default server;

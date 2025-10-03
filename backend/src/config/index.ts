import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../shared/utils/logger';

// Load environment variables from appropriate .env file
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.join(__dirname, '../../', envFile) });

/**
 * Application configuration
 * Centralized configuration management from environment variables
 */
export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'berthcare',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  // Security configuration
  security: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
  },

  // Service ports
  services: {
    user: parseInt(process.env.USER_SERVICE_PORT || '3001', 10),
    visit: parseInt(process.env.VISIT_SERVICE_PORT || '3002', 10),
    sync: parseInt(process.env.SYNC_SERVICE_PORT || '3003', 10),
    notification: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3004', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

/**
 * Validate required environment variables
 */
export const validateConfig = (): void => {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

  for (const key of required) {
    if (!process.env[key]) {
      logger.warn(`Warning: Required environment variable ${key} is not set`);
    }
  }
};

// Export database and Redis connections
export { database, DatabaseHealthStatus } from './database';
export { redis, RedisHealthStatus } from './redis';

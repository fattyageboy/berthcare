import { config, validateConfig } from './config';
import { logger } from './shared/utils/logger';

/**
 * Main entry point for BerthCare backend services
 * This file can be extended to orchestrate multiple microservices
 */

// Validate configuration on startup
validateConfig();

logger.info('='.repeat(50));
logger.info('BerthCare Backend Services');
logger.info('='.repeat(50));
logger.info(`Environment: ${config.nodeEnv}`);
logger.info(`Port: ${config.port}`);
logger.info('='.repeat(50));

// Import and start individual services
// Note: In production, each service would run in its own process/container
// For development, you can start them individually or together

// Uncomment to auto-start all services:
// import './services/user';
// import './services/visit';
// import './services/sync';
// import './services/notification';

logger.info('\nTo start individual services:');
logger.info('  User Service:         ts-node src/services/user');
logger.info('  Visit Service:        ts-node src/services/visit');
logger.info('  Sync Service:         ts-node src/services/sync');
logger.info('  Notification Service: ts-node src/services/notification');
logger.info('='.repeat(50));

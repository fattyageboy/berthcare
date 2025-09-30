import { config, validateConfig } from './config';

/**
 * Main entry point for BerthCare backend services
 * This file can be extended to orchestrate multiple microservices
 */

// Validate configuration on startup
validateConfig();

console.error('='.repeat(50));
console.error('BerthCare Backend Services');
console.error('='.repeat(50));
console.error(`Environment: ${config.nodeEnv}`);
console.error(`Port: ${config.port}`);
console.error('='.repeat(50));

// Import and start individual services
// Note: In production, each service would run in its own process/container
// For development, you can start them individually or together

// Uncomment to auto-start all services:
// import './services/user';
// import './services/visit';
// import './services/sync';
// import './services/notification';

console.error('\nTo start individual services:');
console.error('  User Service:         ts-node src/services/user');
console.error('  Visit Service:        ts-node src/services/visit');
console.error('  Sync Service:         ts-node src/services/sync');
console.error('  Notification Service: ts-node src/services/notification');
console.error('='.repeat(50));

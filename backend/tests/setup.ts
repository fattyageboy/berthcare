/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'berthcare_test';
process.env.DB_USER = 'opus';
process.env.DB_PASSWORD = '';
process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';

// Mock Google Maps API for tests
jest.mock('../src/services/visit/location.service', () => {
  const actual = jest.requireActual('../src/services/visit/location.service');
  return {
    ...actual,
    locationService: {
      verifyVisitLocation: jest.fn().mockResolvedValue({
        verified: true,
        distance: 50, // Mock: 50 meters away
        clientCoordinates: {
          latitude: 49.2827,
          longitude: -123.1207,
        },
      }),
    },
  };
});

// Increase timeout for integration tests
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

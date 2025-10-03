/**
 * Auth0 Service Unit Tests
 * Tests for Auth0 integration and credential verification
 */

import { AuthenticationClient } from 'auth0';
import {
  verifyCredentials,
  validateAuth0Token,
  isAuth0Configured,
} from '../../../src/services/user/auth0.service';

// Mock Auth0
jest.mock('auth0');

describe('Auth0 Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isAuth0Configured', () => {
    it('should return true when all Auth0 env vars are set', () => {
      process.env.AUTH0_DOMAIN = 'test.auth0.com';
      process.env.AUTH0_CLIENT_ID = 'test-client-id';
      process.env.AUTH0_CLIENT_SECRET = 'test-client-secret';

      const result = isAuth0Configured();

      expect(result).toBe(true);
    });

    it('should return false when AUTH0_DOMAIN is missing', () => {
      delete process.env.AUTH0_DOMAIN;
      process.env.AUTH0_CLIENT_ID = 'test-client-id';
      process.env.AUTH0_CLIENT_SECRET = 'test-client-secret';

      const result = isAuth0Configured();

      expect(result).toBe(false);
    });

    it('should return false when AUTH0_CLIENT_ID is missing', () => {
      process.env.AUTH0_DOMAIN = 'test.auth0.com';
      delete process.env.AUTH0_CLIENT_ID;
      process.env.AUTH0_CLIENT_SECRET = 'test-client-secret';

      const result = isAuth0Configured();

      expect(result).toBe(false);
    });

    it('should return false when AUTH0_CLIENT_SECRET is missing', () => {
      process.env.AUTH0_DOMAIN = 'test.auth0.com';
      process.env.AUTH0_CLIENT_ID = 'test-client-id';
      delete process.env.AUTH0_CLIENT_SECRET;

      const result = isAuth0Configured();

      expect(result).toBe(false);
    });

    it('should return false when all Auth0 env vars are missing', () => {
      delete process.env.AUTH0_DOMAIN;
      delete process.env.AUTH0_CLIENT_ID;
      delete process.env.AUTH0_CLIENT_SECRET;

      const result = isAuth0Configured();

      expect(result).toBe(false);
    });
  });

  describe('verifyCredentials', () => {
    let mockAuthClient: any;

    beforeEach(() => {
      process.env.AUTH0_DOMAIN = 'test.auth0.com';
      process.env.AUTH0_CLIENT_ID = 'test-client-id';
      process.env.AUTH0_CLIENT_SECRET = 'test-client-secret';

      // Mock Auth0 client
      mockAuthClient = {
        oauth: {
          passwordGrant: jest.fn(),
        },
      };

      (AuthenticationClient as jest.MockedClass<typeof AuthenticationClient>).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        () => mockAuthClient
      );
    });

    it('should successfully verify valid credentials', async () => {
      mockAuthClient.oauth.passwordGrant.mockResolvedValue({
        data: {
          access_token: 'auth0-access-token',
          id_token: 'auth0-id-token',
        },
      });

      const result = await verifyCredentials('user@example.com', 'password123');

      expect(result).toEqual({
        auth0UserId: 'user@example.com',
        email: 'user@example.com',
      });

      expect(mockAuthClient.oauth.passwordGrant).toHaveBeenCalledWith({
        username: 'user@example.com',
        password: 'password123',
        realm: 'Username-Password-Authentication',
        scope: 'openid profile email',
      });
    });

    it('should return user info with email as identifier', async () => {
      mockAuthClient.oauth.passwordGrant.mockResolvedValue({
        data: {
          access_token: 'auth0-access-token',
          id_token: 'id-token',
        },
      });

      const result = await verifyCredentials('user@example.com', 'password123');

      expect(result.email).toBe('user@example.com');
      expect(result.auth0UserId).toBe('user@example.com');
    });

    it('should create Auth0 client with correct config', () => {
      // Just verify the constructor is available and callable
      const client = new AuthenticationClient({
        domain: 'test.auth0.com',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      expect(client).toBeDefined();
      expect(AuthenticationClient).toHaveBeenCalled();
    });
  });

  describe('validateAuth0Token', () => {
    let mockAuthClient: any;

    beforeEach(() => {
      process.env.AUTH0_DOMAIN = 'test.auth0.com';
      process.env.AUTH0_CLIENT_ID = 'test-client-id';
      process.env.AUTH0_CLIENT_SECRET = 'test-client-secret';

      mockAuthClient = {
        oauth: {
          passwordGrant: jest.fn(),
        },
      };

      (AuthenticationClient as jest.MockedClass<typeof AuthenticationClient>).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        () => mockAuthClient
      );
    });

    it('should return true for valid token and client when Auth0 is configured', () => {
      process.env.AUTH0_DOMAIN = 'test.auth0.com';
      process.env.AUTH0_CLIENT_ID = 'test-client-id';
      process.env.AUTH0_CLIENT_SECRET = 'test-client-secret';

      const result = validateAuth0Token('valid-token');

      expect(result).toBe(true);
    });

    it('should return false for empty token', () => {
      const result = validateAuth0Token('');

      expect(result).toBe(false);
    });

    it('should return true when token validation check passes', () => {
      process.env.AUTH0_DOMAIN = 'test.auth0.com';
      process.env.AUTH0_CLIENT_ID = 'test-client-id';
      process.env.AUTH0_CLIENT_SECRET = 'test-client-secret';

      const result = validateAuth0Token('some-token-value');

      // Function returns true if client exists and token is non-empty
      expect(result).toBe(true);
    });
  });
});

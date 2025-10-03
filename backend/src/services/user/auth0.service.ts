/**
 * Auth0 Service
 * Handles authentication through Auth0 SDK
 */

import { AuthenticationClient } from 'auth0';

interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Get Auth0 configuration from environment
 */
const getAuth0Config = (): Auth0Config => {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;

  if (!domain || !clientId || !clientSecret) {
    throw new Error('Auth0 configuration is incomplete. Please check environment variables.');
  }

  return { domain, clientId, clientSecret };
};

/**
 * Initialize Auth0 authentication client
 */
let authClient: AuthenticationClient | null = null;

const getAuthClient = (): AuthenticationClient => {
  if (!authClient) {
    const auth0Config = getAuth0Config();
    authClient = new AuthenticationClient({
      domain: auth0Config.domain,
      clientId: auth0Config.clientId,
      clientSecret: auth0Config.clientSecret,
    });
  }
  return authClient;
};

/**
 * Verify user credentials with Auth0
 * Returns Auth0 user ID on success, throws error on failure
 */
export const verifyCredentials = async (
  email: string,
  password: string
): Promise<{ auth0UserId: string; email: string }> => {
  try {
    const client = getAuthClient();

    // Use Resource Owner Password Grant
    // Note: This requires the connection to be configured in Auth0
    const response = (await client.oauth.passwordGrant({
      username: email,
      password: password,
      realm: 'Username-Password-Authentication', // Default Auth0 database connection
      scope: 'openid profile email',
    })) as { data: { access_token?: string } };

    if (!response.data.access_token) {
      throw new Error('Invalid credentials');
    }

    // Get user info from Auth0 using the access token
    // Note: In production, you may want to use the Management API or decode the token
    // For now, we'll return basic info since Resource Owner Password Grant is being used
    return {
      auth0UserId: email, // Use email as identifier for local lookup
      email: email,
    };
  } catch (error) {
    if (error instanceof Error) {
      // Auth0 specific errors
      if (error.message.includes('invalid_grant') || error.message.includes('Unauthorized')) {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
    throw new Error('Authentication failed');
  }
};

/**
 * Validate Auth0 token
 * Note: This is a placeholder. In production, use Auth0's token validation
 */
export const validateAuth0Token = (token: string): boolean => {
  try {
    const client = getAuthClient();
    // Attempt to use the token with Auth0's passwordGrant to verify it's valid
    // In production, consider using the Management API or JWT verification
    return !!client && !!token;
  } catch {
    return false;
  }
};

/**
 * Check if Auth0 is configured
 * Returns true if all required environment variables are set
 */
export const isAuth0Configured = (): boolean => {
  try {
    getAuth0Config();
    return true;
  } catch {
    return false;
  }
};

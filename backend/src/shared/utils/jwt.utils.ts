/**
 * JWT Token Utilities
 * Handles generation and verification of JWT tokens
 */

import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { TokenPayload } from '../types';

/**
 * Generate access token (1 hour expiration)
 */
export const generateAccessToken = (payload: Omit<TokenPayload, 'type'>): string => {
  const tokenPayload: TokenPayload = {
    ...payload,
    type: 'access',
  };

  return jwt.sign(tokenPayload, config.security.jwtSecret, {
    expiresIn: '1h', // 1 hour as per requirements
    issuer: 'berthcare-auth',
    audience: 'berthcare-api',
  });
};

/**
 * Generate refresh token (30 day expiration)
 */
export const generateRefreshToken = (payload: Omit<TokenPayload, 'type'>): string => {
  const tokenPayload: TokenPayload = {
    ...payload,
    type: 'refresh',
  };

  return jwt.sign(tokenPayload, config.security.jwtSecret, {
    expiresIn: '30d', // 30 days as per requirements
    issuer: 'berthcare-auth',
    audience: 'berthcare-api',
  });
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.security.jwtSecret, {
      issuer: 'berthcare-auth',
      audience: 'berthcare-api',
    });

    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Get token expiration timestamp
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token);
    if (
      decoded &&
      typeof decoded === 'object' &&
      'exp' in decoded &&
      typeof decoded.exp === 'number'
    ) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return true;
  }
  return expiration < new Date();
};

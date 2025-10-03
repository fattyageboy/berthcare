/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user information to request
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { verifyToken } from '../utils';
import { validateAccessToken } from '../../services/user/auth.service';
import { ApiResponse, AuthenticatedRequest } from '../types';

/**
 * Authenticate middleware
 * Validates JWT token from Authorization header and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No authorization token provided',
      } as ApiResponse<unknown>);
      return;
    }

    // Check Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid authorization header format. Use: Bearer <token>',
      } as ApiResponse<unknown>);
      return;
    }

    const token = parts[1];

    // Verify token signature and expiration
    let tokenPayload;
    try {
      tokenPayload = verifyToken(token);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Token has expired',
          } as ApiResponse<unknown>);
          return;
        }
      }

      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token',
      } as ApiResponse<unknown>);
      return;
    }

    // Verify token type is access token
    if (tokenPayload.type !== 'access') {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token type. Access token required',
      } as ApiResponse<unknown>);
      return;
    }

    // Validate token and get user information from database
    const user = await validateAccessToken(token);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token or user not found',
      } as ApiResponse<unknown>);
      return;
    }

    // Attach user to request object
    (req as AuthenticatedRequest).user = user;

    // Continue to next middleware
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during authentication',
    } as ApiResponse<unknown>);
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if valid token is provided, but allows request to continue without token
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // If no auth header, just continue
    if (!authHeader) {
      next();
      return;
    }

    // Check Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      next();
      return;
    }

    const token = parts[1];

    // Try to verify and validate token
    try {
      const tokenPayload = verifyToken(token);

      if (tokenPayload.type === 'access') {
        const user = await validateAccessToken(token);
        if (user) {
          (req as AuthenticatedRequest).user = user;
        }
      }
    } catch {
      // Silently fail - just continue without user
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next(); // Continue even on error
  }
};

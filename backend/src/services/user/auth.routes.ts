/**
 * Authentication Routes
 * Handles login and token refresh endpoints
 */

import { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { authRateLimiter } from '../../shared/middleware';
import { ApiResponse, LoginRequest, RefreshTokenRequest, AuthResponse } from '../../shared/types';
import { login, refreshAccessToken } from './auth.service';
import { validateLogin, validateRefreshToken } from './validation';

const router = Router();

/**
 * POST /auth/login
 * User authentication with mobile device registration
 */
router.post(
  '/login',
  authRateLimiter,
  validateLogin,
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'Invalid input data',
          data: errors.array(),
        } as ApiResponse<unknown>);
        return;
      }

      // Extract login request data (validated by express-validator middleware)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const { email, password, device_id, device_type } = req.body;
      const loginRequest: LoginRequest = {
        email: email as string,
        password: password as string,
        device_id: device_id as string,
        device_type: device_type as 'ios' | 'android' | 'web',
      };

      // Authenticate user
      const authResponse: AuthResponse = await login(loginRequest);

      // Return success response
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: authResponse,
      } as ApiResponse<AuthResponse>);
    } catch (error) {
      // Handle authentication errors
      if (error instanceof Error) {
        if (
          error.message.includes('Invalid email or password') ||
          error.message.includes('User not found')
        ) {
          res.status(401).json({
            success: false,
            error: 'Invalid credentials',
            message: 'Invalid email or password',
          } as ApiResponse<unknown>);
          return;
        }

        if (error.message.includes('Missing required fields')) {
          res.status(400).json({
            success: false,
            error: 'Bad request',
            message: error.message,
          } as ApiResponse<unknown>);
          return;
        }
      }

      // Generic error response
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during login',
      } as ApiResponse<unknown>);
    }
  }
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  authRateLimiter,
  validateRefreshToken,
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'Invalid input data',
          data: errors.array(),
        } as ApiResponse<unknown>);
        return;
      }

      // Extract refresh token request data (validated by express-validator middleware)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const { refresh_token, device_id } = req.body;
      const refreshRequest: RefreshTokenRequest = {
        refresh_token: refresh_token as string,
        device_id: device_id as string,
      };

      // Refresh access token
      const authResponse: AuthResponse = await refreshAccessToken(refreshRequest);

      // Return success response
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: authResponse,
      } as ApiResponse<AuthResponse>);
    } catch (error) {
      // Handle token refresh errors
      if (error instanceof Error) {
        if (
          error.message.includes('Invalid or expired refresh token') ||
          error.message.includes('Invalid device binding') ||
          error.message.includes('Device ID mismatch') ||
          error.message.includes('Invalid token type')
        ) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: error.message,
          } as ApiResponse<unknown>);
          return;
        }

        if (error.message.includes('Missing required fields')) {
          res.status(400).json({
            success: false,
            error: 'Bad request',
            message: error.message,
          } as ApiResponse<unknown>);
          return;
        }

        if (error.message.includes('User not found')) {
          res.status(404).json({
            success: false,
            error: 'Not found',
            message: 'User not found',
          } as ApiResponse<unknown>);
          return;
        }
      }

      // Generic error response
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during token refresh',
      } as ApiResponse<unknown>);
    }
  }
);

export default router;

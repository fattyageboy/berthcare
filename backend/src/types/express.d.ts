/**
 * Express Type Extensions
 * Extends Express Request type with custom properties
 */

declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

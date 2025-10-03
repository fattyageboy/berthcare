/**
 * Express Type Extensions
 * Extends Express Request type with custom properties
 */

declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      organization_id: string | null;
    };
  }
}

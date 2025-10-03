import { database } from '../../config';
import { QueryResult } from 'pg';
import { locationService, ClientAddress } from './location.service';

/**
 * Visit Repository
 * Data access layer for visit management
 */

export interface Visit {
  id: string;
  client_id: string;
  user_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  check_in_location: string | null;
  check_out_location: string | null;
  visit_type: string;
  status: string;
  documentation: Record<string, unknown> | null;
  photos: string[] | null;
  signature_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  address: {
    street: string;
    city: string;
    postal_code: string;
  };
}

export interface VisitWithClient extends Visit {
  client: Client;
}

export interface GetVisitsParams {
  userId: string;
  dateFrom: string;
  dateTo: string;
  status?: string[];
  clientId?: string;
  page?: number;
  perPage?: number;
}

export interface GetVisitsResult {
  visits: VisitWithClient[];
  totalCount: number;
  page: number;
  perPage: number;
  hasNext: boolean;
}

export interface CheckInParams {
  visitId: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  verifyLocation?: boolean; // Optional location verification
}

export interface LocationVerificationResult {
  verified: boolean;
  distance: number;
  clientCoordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface UpdateDocumentationParams {
  visitId: string;
  userId: string;
  documentation?: Record<string, unknown>;
  notes?: string;
  photos?: string[];
}

export interface CompleteVisitParams {
  visitId: string;
  userId: string;
  documentation?: Record<string, unknown>;
  signature?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export class VisitRepository {
  /**
   * Get visits for a user with filters
   */
  async getVisits(params: GetVisitsParams): Promise<GetVisitsResult> {
    const { userId, dateFrom, dateTo, status, clientId, page = 1, perPage = 20 } = params;

    const offset = (page - 1) * perPage;
    const queryParams: unknown[] = [userId, dateFrom, dateTo];
    let paramIndex = 4;

    let whereClause =
      'WHERE v.user_id = $1 AND v.scheduled_start >= $2 AND v.scheduled_start <= $3';

    if (status && status.length > 0) {
      whereClause += ` AND v.status = ANY($${paramIndex})`;
      queryParams.push(status);
      paramIndex++;
    }

    if (clientId) {
      whereClause += ` AND v.client_id = $${paramIndex}`;
      queryParams.push(clientId);
      paramIndex++;
    }

    const query = `
      SELECT 
        v.*,
        json_build_object(
          'id', c.id,
          'first_name', c.first_name,
          'last_name', c.last_name,
          'address', c.address
        ) as client
      FROM visits v
      INNER JOIN clients c ON v.client_id = c.id
      ${whereClause}
      ORDER BY v.scheduled_start ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM visits v
      ${whereClause}
    `;

    // Count query only needs WHERE clause parameters (not LIMIT/OFFSET)
    const countParams = [...queryParams]; // Copy before adding LIMIT/OFFSET

    // Add LIMIT and OFFSET to query params for the main query
    queryParams.push(perPage, offset);

    const [visitsResult, countResult]: [QueryResult, QueryResult] = await Promise.all([
      database.query(query, queryParams),
      database.query(countQuery, countParams),
    ]);

    const totalRow = countResult.rows[0] as { total: string } | undefined;
    const totalCount = parseInt(String(totalRow?.total || '0'), 10);
    const hasNext = offset + perPage < totalCount;

    return {
      visits: visitsResult.rows as VisitWithClient[],
      totalCount,
      page,
      perPage,
      hasNext,
    };
  }

  /**
   * Get a single visit by ID
   */
  async getVisitById(visitId: string, userId: string): Promise<Visit | null> {
    const query = `
      SELECT * FROM visits
      WHERE id = $1 AND user_id = $2
    `;

    const result = await database.query(query, [visitId, userId]);
    return (result.rows[0] as Visit) || null;
  }

  /**
   * Check in to a visit with optional location verification
   */
  async checkIn(params: CheckInParams): Promise<Visit> {
    const { visitId, userId, latitude, longitude, timestamp, verifyLocation = false } = params;

    // Optionally verify location before check-in
    if (verifyLocation) {
      const verification = await this.verifyLocationWithGeocoding(visitId, latitude, longitude);
      if (!verification.verified) {
        throw new Error(
          `Location verification failed: ${verification.distance}m from client address (max allowed: 500m)`
        );
      }
    }

    const query = `
      UPDATE visits
      SET 
        status = 'in_progress',
        actual_start = $3,
        check_in_location = POINT($4, $5),
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND status = 'scheduled'
      RETURNING *
    `;

    const result = await database.query(query, [visitId, userId, timestamp, longitude, latitude]);

    if (result.rows.length === 0) {
      throw new Error('Visit not found or cannot be checked in');
    }

    return result.rows[0] as Visit;
  }

  /**
   * Update visit documentation
   */
  async updateDocumentation(params: UpdateDocumentationParams): Promise<Visit> {
    const { visitId, userId, documentation, notes, photos } = params;

    // Build dynamic update query based on provided fields
    const updates: string[] = ['updated_at = NOW()'];
    const queryParams: unknown[] = [visitId, userId];
    let paramIndex = 3;

    if (documentation !== undefined) {
      updates.push(`documentation = COALESCE(documentation, '{}'::jsonb) || $${paramIndex}::jsonb`);
      queryParams.push(JSON.stringify(documentation));
      paramIndex++;
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex}`);
      queryParams.push(notes);
      paramIndex++;
    }

    if (photos !== undefined) {
      updates.push(`photos = $${paramIndex}`);
      queryParams.push(photos);
      paramIndex++;
    }

    const query = `
      UPDATE visits
      SET ${updates.join(', ')}
      WHERE id = $1 AND user_id = $2 AND status IN ('scheduled', 'in_progress')
      RETURNING *
    `;

    const result = await database.query(query, queryParams);

    if (result.rows.length === 0) {
      throw new Error('Visit not found or cannot be updated');
    }

    return result.rows[0] as Visit;
  }

  /**
   * Complete a visit
   */
  async completeVisit(params: CompleteVisitParams): Promise<Visit> {
    const { visitId, userId, documentation, signature, latitude, longitude } = params;

    const updates: string[] = [
      "status = 'completed'",
      "actual_end = GREATEST(NOW(), actual_start + INTERVAL '1 millisecond')",
      'updated_at = NOW()',
    ];
    const queryParams: unknown[] = [visitId, userId];
    let paramIndex = 3;

    if (documentation !== undefined) {
      updates.push(`documentation = COALESCE(documentation, '{}'::jsonb) || $${paramIndex}::jsonb`);
      queryParams.push(JSON.stringify(documentation));
      paramIndex++;
    }

    if (signature !== undefined) {
      updates.push(`signature_url = $${paramIndex}`);
      queryParams.push(signature);
      paramIndex++;
    }

    if (latitude !== undefined && longitude !== undefined) {
      updates.push(`check_out_location = POINT($${paramIndex}, $${paramIndex + 1})`);
      queryParams.push(longitude, latitude);
      paramIndex += 2;
    }

    const query = `
      UPDATE visits
      SET ${updates.join(', ')}
      WHERE id = $1 AND user_id = $2 AND status = 'in_progress'
      RETURNING *
    `;

    const result = await database.query(query, queryParams);

    if (result.rows.length === 0) {
      throw new Error('Visit not found or cannot be completed');
    }

    return result.rows[0] as Visit;
  }

  /**
   * Verify location using Google Maps Geocoding API
   * Geocodes client address and calculates distance to user location
   * Allows 100m radius for urban areas, 500m for rural areas
   */
  async verifyLocationWithGeocoding(
    visitId: string,
    latitude: number,
    longitude: number
  ): Promise<LocationVerificationResult> {
    // Get client address from database
    const query = `
      SELECT c.address
      FROM visits v
      INNER JOIN clients c ON v.client_id = c.id
      WHERE v.id = $1
    `;

    const result = await database.query(query, [visitId]);

    if (result.rows.length === 0) {
      throw new Error('Visit not found');
    }

    const addressRow = result.rows[0] as { address: ClientAddress };
    const clientAddress = addressRow.address;

    // Use location service to verify
    const verification = await locationService.verifyVisitLocation(
      { latitude, longitude },
      clientAddress
    );

    return {
      verified: verification.verified,
      distance: verification.distance,
      clientCoordinates: verification.clientCoordinates,
    };
  }

  /**
   * Legacy method: Verify location using database coordinates (if stored)
   * This method assumes coordinates are already stored in the client address
   * For new implementations, use verifyLocationWithGeocoding instead
   */
  async verifyLocation(
    visitId: string,
    latitude: number,
    longitude: number
  ): Promise<{ verified: boolean; distance: number }> {
    const query = `
      SELECT 
        ST_Distance(
          ST_GeogFromText('POINT(' || (c.address->>'longitude')::text || ' ' || (c.address->>'latitude')::text || ')'),
          ST_GeogFromText('POINT($2 $3)')
        ) as distance
      FROM visits v
      INNER JOIN clients c ON v.client_id = c.id
      WHERE v.id = $1
    `;

    const result = await database.query(query, [visitId, longitude, latitude]);

    if (result.rows.length === 0) {
      throw new Error('Visit not found');
    }

    const distanceRow = result.rows[0] as { distance: string | number } | undefined;
    const distanceValue = distanceRow?.distance;
    const distance =
      typeof distanceValue === 'string' ? parseFloat(distanceValue) : Number(distanceValue);
    // Allow 100m for urban, 500m for rural (simplified - using 500m for all)
    const verified = distance <= 500;

    return { verified, distance };
  }
}

export const visitRepository = new VisitRepository();

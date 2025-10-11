/**
 * Zone Assignment Service
 *
 * Assigns clients to zones based on geographic location.
 *
 * Features:
 * - Proximity-based zone assignment
 * - Distance calculation using Haversine formula
 * - Zone data caching
 * - Fallback to default zone
 *
 * Reference: Architecture Blueprint - Client Management
 * Task: C5 - Create client endpoint with zone assignment
 *
 * Philosophy: "Start with user experience"
 * - Fast zone assignment via caching
 * - Accurate distance calculations
 * - Graceful fallback for edge cases
 */

import { RedisClientType } from 'redis';

/**
 * Zone data
 */
export interface Zone {
  id: string;
  name: string;
  centerLatitude: number;
  centerLongitude: number;
}

/**
 * Zone assignment error
 */
export class ZoneAssignmentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ZoneAssignmentError';
  }
}

/**
 * Zone Assignment Service
 *
 * Handles zone assignment based on geographic proximity.
 */
export class ZoneAssignmentService {
  private cacheTTL: number = 3600; // 1 hour

  constructor(private redisClient: RedisClientType) {}

  /**
   * Assign a zone based on latitude/longitude
   *
   * Uses proximity to zone center points to determine nearest zone.
   *
   * @param latitude - Client latitude
   * @param longitude - Client longitude
   * @returns Zone ID
   * @throws ZoneAssignmentError if no zones available
   */
  async assignZone(latitude: number, longitude: number): Promise<string> {
    // Validate coordinates
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      throw new ZoneAssignmentError('Invalid coordinates', 'INVALID_COORDINATES', {
        latitude,
        longitude,
      });
    }

    // Get all active zones
    const zones = await this.getAllZones();

    if (zones.length === 0) {
      throw new ZoneAssignmentError('No zones available for assignment', 'NO_ZONES_AVAILABLE');
    }

    // Find nearest zone
    let nearestZone = zones[0];
    let minDistance = this.calculateDistance(
      latitude,
      longitude,
      zones[0].centerLatitude,
      zones[0].centerLongitude
    );

    for (const zone of zones.slice(1)) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        zone.centerLatitude,
        zone.centerLongitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = zone;
      }
    }

    return nearestZone.id;
  }

  /**
   * Get all active zones
   *
   * Results are cached for 1 hour to reduce database queries.
   *
   * @returns Array of zones
   */
  private async getAllZones(): Promise<Zone[]> {
    const cacheKey = 'zones:all';

    // Try cache first
    try {
      const cachedData = await this.redisClient.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (cacheError) {
      console.warn('Zone cache read error:', cacheError);
    }

    // Query database
    // Note: For MVP, we'll create a simple zones table
    // For now, return hardcoded zones for development
    // TODO: Replace with actual database query when zones table exists
    const zones: Zone[] = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'North Zone',
        centerLatitude: 45.5017,
        centerLongitude: -73.5673, // Montreal area
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'South Zone',
        centerLatitude: 43.6532,
        centerLongitude: -79.3832, // Toronto area
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'West Zone',
        centerLatitude: 49.2827,
        centerLongitude: -123.1207, // Vancouver area
      },
    ];

    // Cache zones
    try {
      await this.redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(zones));
    } catch (cacheError) {
      console.warn('Zone cache write error:', cacheError);
    }

    return zones;
  }

  /**
   * Calculate distance between two points using Haversine formula
   *
   * @param lat1 - First point latitude
   * @param lon1 - First point longitude
   * @param lat2 - Second point latitude
   * @param lon2 - Second point longitude
   * @returns Distance in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers

    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Convert degrees to radians
   *
   * @param degrees - Angle in degrees
   * @returns Angle in radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate a zone ID exists
   *
   * @param zoneId - Zone ID to validate
   * @returns true if zone exists
   */
  async validateZoneId(zoneId: string): Promise<boolean> {
    const zones = await this.getAllZones();
    return zones.some((zone) => zone.id === zoneId);
  }

  /**
   * Clear zone cache
   */
  async clearCache(): Promise<void> {
    try {
      await this.redisClient.del('zones:all');
    } catch (error) {
      console.warn('Failed to clear zone cache:', error);
    }
  }
}

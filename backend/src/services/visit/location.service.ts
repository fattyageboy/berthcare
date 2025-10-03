import { Client as GoogleMapsClient, GeocodeResult } from '@googlemaps/google-maps-services-js';

/**
 * Location Verification Service
 * Validates check-in/check-out coordinates against client address using Google Maps Geocoding API
 * Allows 100m radius for urban areas, 500m for rural areas
 */

export interface LocationCoordinates {
    latitude: number;
    longitude: number;
}

export interface VerificationResult {
    verified: boolean;
    distance: number;
    clientCoordinates: LocationCoordinates;
    accuracy?: number;
}

export interface ClientAddress {
    street: string;
    city: string;
    postal_code: string;
    province?: string;
    country?: string;
}

export class LocationVerificationService {
    private googleMapsClient: GoogleMapsClient;
    private apiKey: string;

    constructor() {
        this.googleMapsClient = new GoogleMapsClient({});
        this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';

        if (!this.apiKey) {
            console.warn('GOOGLE_MAPS_API_KEY not configured - location verification will fail');
        }
    }

    /**
     * Geocode an address to get coordinates using Google Maps Geocoding API
     */
    async geocodeAddress(address: ClientAddress): Promise<LocationCoordinates> {
        if (!this.apiKey) {
            throw new Error('Google Maps API key not configured');
        }

        const addressString = this.formatAddress(address);

        try {
            const response = await this.googleMapsClient.geocode({
                params: {
                    address: addressString,
                    key: this.apiKey,
                },
            });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            if (response.data.status !== 'OK' || response.data.results.length === 0) {
                throw new Error(`Geocoding failed: ${String(response.data.status)}`);
            }

            const result: GeocodeResult = response.data.results[0];
            const location = result.geometry.location;

            return {
                latitude: location.lat,
                longitude: location.lng,
            };
        } catch (error) {
            console.error('Geocoding error:', error);
            throw new Error('Failed to geocode address');
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in meters
     */
    calculateDistance(coord1: LocationCoordinates, coord2: LocationCoordinates): number {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (coord1.latitude * Math.PI) / 180;
        const φ2 = (coord2.latitude * Math.PI) / 180;
        const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
        const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    /**
     * Determine if an area is rural based on geocoding result
     * Uses Google Maps location_type and address components
     */
    async isRuralArea(coordinates: LocationCoordinates): Promise<boolean> {
        if (!this.apiKey) {
            // Default to rural (more permissive) if API not available
            return true;
        }

        try {
            const response = await this.googleMapsClient.reverseGeocode({
                params: {
                    latlng: `${coordinates.latitude},${coordinates.longitude}`,
                    key: this.apiKey,
                },
            });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            if (response.data.status !== 'OK' || response.data.results.length === 0) {
                // Default to rural if reverse geocoding fails
                return true;
            }

            const result: GeocodeResult = response.data.results[0];

            // Check for urban indicators in address components
            const hasUrbanIndicators = result.address_components.some((component: { types: string[] }) => {
                const types = component.types as string[];
                return (
                    types.includes('locality') ||
                    types.includes('sublocality') ||
                    types.includes('neighborhood')
                );
            });

            // If location_type is APPROXIMATE or no urban indicators, consider it rural
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            const isApproximate = result.geometry.location_type === 'APPROXIMATE';

            return isApproximate || !hasUrbanIndicators;
        } catch (error) {
            console.error('Rural area detection error:', error);
            // Default to rural (more permissive) on error
            return true;
        }
    }

    /**
     * Verify if user location is within acceptable radius of client address
     * Returns verification result with distance and coordinates
     */
    async verifyVisitLocation(
        userLocation: LocationCoordinates,
        clientAddress: ClientAddress,
        accuracy?: number
    ): Promise<VerificationResult> {
        // Geocode client address to get coordinates
        const clientCoordinates = await this.geocodeAddress(clientAddress);

        // Calculate distance between user and client
        const distance = this.calculateDistance(userLocation, clientCoordinates);

        // Determine allowed radius based on area type
        const isRural = await this.isRuralArea(clientCoordinates);
        const allowedRadius = isRural ? 500 : 100; // 500m rural, 100m urban

        // Verify location is within allowed radius
        const verified = distance <= allowedRadius;

        return {
            verified,
            distance: Math.round(distance), // Round to nearest meter
            clientCoordinates,
            accuracy,
        };
    }

    /**
     * Format address object into a string for geocoding
     */
    private formatAddress(address: ClientAddress): string {
        const parts = [
            address.street,
            address.city,
            address.province,
            address.postal_code,
            address.country || 'Canada', // Default to Canada for maritime context
        ];

        return parts.filter(Boolean).join(', ');
    }
}

export const locationService = new LocationVerificationService();

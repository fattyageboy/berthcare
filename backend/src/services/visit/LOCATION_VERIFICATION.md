# GPS Location Verification Service

## Overview

The GPS Location Verification Service validates check-in and check-out coordinates against client addresses using the Google Maps Geocoding API. This ensures caregivers are physically present at the client's location during visits.

## Features

- **Address Geocoding**: Converts client addresses to GPS coordinates using Google Maps Geocoding API
- **Distance Calculation**: Uses Haversine formula to calculate distance between user and client locations
- **Urban/Rural Detection**: Automatically determines if location is urban or rural for appropriate radius thresholds
- **Flexible Radius**: 100m for urban areas, 500m for rural areas
- **Graceful Degradation**: Service continues to function even if location verification fails

## Architecture

### Components

1. **LocationVerificationService** (`location.service.ts`)
   - Handles Google Maps API integration
   - Geocodes addresses to coordinates
   - Calculates distances between coordinates
   - Determines urban vs rural areas

2. **VisitRepository** (`repository.ts`)
   - `verifyLocationWithGeocoding()`: New method using Google Maps API
   - `verifyLocation()`: Legacy method using stored coordinates
   - Integrates location verification into check-in flow

3. **VisitController** (`controller.ts`)
   - `/api/visits/:id/verify-location`: Standalone verification endpoint
   - `/api/visits/:id/check-in`: Automatic verification during check-in

## Configuration

### Environment Variables

Add to `.env`:

```bash
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

### Google Maps API Setup

1. Create a Google Cloud Platform project
2. Enable the Geocoding API
3. Create an API key with appropriate restrictions
4. Add the API key to your environment configuration

**Recommended API Restrictions:**
- API restrictions: Restrict to Geocoding API only
- Application restrictions: IP address restrictions for production servers

## API Endpoints

### 1. Verify Location

Verify if user location is within acceptable radius of client address.

**Endpoint:** `POST /api/visits/:id/verify-location`

**Request:**
```json
{
  "location": {
    "latitude": 44.6488,
    "longitude": -63.5752,
    "accuracy": 10
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Location verified successfully",
  "data": {
    "verified": true,
    "distance": 45,
    "client_coordinates": {
      "latitude": 44.6492,
      "longitude": -63.5748
    },
    "user_location": {
      "latitude": 44.6488,
      "longitude": -63.5752,
      "accuracy": 10
    },
    "allowed_radius": 100
  }
}
```

**Response (Failed):**
```json
{
  "success": true,
  "message": "Location verification failed",
  "data": {
    "verified": false,
    "distance": 650,
    "client_coordinates": {
      "latitude": 44.6492,
      "longitude": -63.5748
    },
    "user_location": {
      "latitude": 44.6488,
      "longitude": -63.5752,
      "accuracy": 10
    },
    "allowed_radius": 500
  }
}
```

### 2. Check-In with Location Verification

Check-in endpoint automatically verifies location during the check-in process.

**Endpoint:** `POST /api/visits/:id/check-in`

**Request:**
```json
{
  "location": {
    "latitude": 44.6488,
    "longitude": -63.5752,
    "accuracy": 10
  },
  "timestamp": "2024-01-15T09:05:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "visit_id": "650e8400-e29b-41d4-a716-446655440001",
    "checked_in_at": "2024-01-15T09:05:00Z",
    "location_verified": true,
    "verification_distance": 45,
    "status": "in_progress"
  }
}
```

## Location Verification Logic

### Distance Calculation

Uses the Haversine formula to calculate great-circle distance between two points on Earth:

```typescript
const R = 6371e3; // Earth's radius in meters
const φ1 = (lat1 * Math.PI) / 180;
const φ2 = (lat2 * Math.PI) / 180;
const Δφ = ((lat2 - lat1) * Math.PI) / 180;
const Δλ = ((lon2 - lon1) * Math.PI) / 180;

const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

const distance = R * c; // Distance in meters
```

### Urban vs Rural Detection

The service uses reverse geocoding to determine if an area is urban or rural:

**Urban Indicators:**
- Address components include `locality`, `sublocality`, or `neighborhood`
- Location type is `ROOFTOP` or `RANGE_INTERPOLATED`

**Rural Indicators:**
- Location type is `APPROXIMATE`
- No urban address components present

**Allowed Radius:**
- Urban: 100 meters
- Rural: 500 meters

### Graceful Degradation

If location verification fails (API error, network issue, etc.):
- Check-in continues to function
- `location_verified` is set to `false`
- Error is logged for monitoring
- Distance is set to `0`

## Database Schema

### Visits Table

Location data is stored in the `visits` table:

```sql
check_in_location POINT,      -- GPS coordinates at check-in (longitude, latitude)
check_out_location POINT,     -- GPS coordinates at check-out (longitude, latitude)
```

### Clients Table

Client addresses are stored as JSONB:

```sql
address JSONB NOT NULL
```

**Address Structure:**
```json
{
  "street": "123 Main Street",
  "city": "Halifax",
  "province": "Nova Scotia",
  "postal_code": "B3H 1A1",
  "country": "Canada"
}
```

## Usage Examples

### Standalone Verification

Use the verification endpoint before check-in to provide user feedback:

```typescript
// Mobile app checks location before allowing check-in
const verifyLocation = async (visitId: string, location: Location) => {
  const response = await fetch(`/api/visits/${visitId}/verify-location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId
    },
    body: JSON.stringify({ location })
  });
  
  const result = await response.json();
  
  if (!result.data.verified) {
    alert(`You are ${result.data.distance}m from the client location. Please move closer.`);
    return false;
  }
  
  return true;
};
```

### Automatic Verification During Check-In

The check-in endpoint automatically verifies location:

```typescript
// Check-in with automatic verification
const checkIn = async (visitId: string, location: Location) => {
  const response = await fetch(`/api/visits/${visitId}/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId
    },
    body: JSON.stringify({
      location,
      timestamp: new Date().toISOString()
    })
  });
  
  const result = await response.json();
  
  if (!result.data.location_verified) {
    console.warn('Location verification failed, but check-in succeeded');
  }
  
  return result;
};
```

## Error Handling

### Common Errors

1. **Missing API Key**
   - Error: "Google Maps API key not configured"
   - Solution: Add `GOOGLE_MAPS_API_KEY` to environment

2. **Geocoding Failed**
   - Error: "Geocoding failed: ZERO_RESULTS"
   - Cause: Invalid or incomplete address
   - Solution: Verify client address is complete and accurate

3. **API Quota Exceeded**
   - Error: "Geocoding failed: OVER_QUERY_LIMIT"
   - Solution: Check Google Cloud Platform quota and billing

4. **Invalid Coordinates**
   - Error: Validation error from express-validator
   - Solution: Ensure latitude is -90 to 90, longitude is -180 to 180

### Error Response Format

```json
{
  "success": false,
  "message": "Failed to verify location",
  "error": "Google Maps API key not configured"
}
```

## Performance Considerations

### Caching

Consider caching geocoded addresses to reduce API calls:

```typescript
// Cache client coordinates for 24 hours
const geocodeCache = new Map<string, {
  coordinates: LocationCoordinates;
  timestamp: number;
}>();

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
```

### Rate Limiting

Google Maps Geocoding API has rate limits:
- Free tier: 40,000 requests per month
- Paid tier: Higher limits based on billing

Monitor usage in Google Cloud Console.

### Optimization Tips

1. **Batch Geocoding**: Geocode all client addresses during off-peak hours
2. **Store Coordinates**: Save geocoded coordinates in client address JSONB
3. **Use Legacy Method**: Fall back to stored coordinates if API unavailable
4. **Implement Caching**: Cache geocoding results to reduce API calls

## Testing

### Manual Testing

Use the provided HTTP examples in `test-examples.http`:

```http
### Verify Location
POST http://localhost:3002/api/visits/{{visitId}}/verify-location
Content-Type: application/json
x-user-id: {{userId}}

{
  "location": {
    "latitude": 51.0447,
    "longitude": -114.0719,
    "accuracy": 5.0
  }
}
```

### Test Scenarios

1. **Valid Location (Urban)**
   - Distance: < 100m
   - Expected: `verified: true`

2. **Valid Location (Rural)**
   - Distance: < 500m
   - Expected: `verified: true`

3. **Invalid Location**
   - Distance: > 500m
   - Expected: `verified: false`

4. **API Unavailable**
   - No API key configured
   - Expected: Graceful degradation, check-in succeeds

## Security Considerations

### API Key Protection

- Never commit API keys to version control
- Use environment variables for configuration
- Restrict API key to specific APIs and IP addresses
- Rotate API keys regularly

### Data Privacy

- GPS coordinates are sensitive personal data
- Store coordinates securely in database
- Implement access controls for location data
- Consider data retention policies

### Validation

- Validate all GPS coordinates (latitude, longitude ranges)
- Validate accuracy values (must be positive)
- Sanitize address inputs before geocoding
- Implement rate limiting on verification endpoints

## Monitoring and Logging

### Key Metrics

- Location verification success rate
- Average distance from client location
- API response times
- API error rates
- Geocoding cache hit rate

### Logging

The service logs important events:

```typescript
console.log(`Location verification: ${verified ? 'PASSED' : 'FAILED'} - Distance: ${distance}m`);
console.error('Location verification failed:', error);
console.warn('GOOGLE_MAPS_API_KEY not configured - location verification will fail');
```

### Alerts

Set up alerts for:
- High verification failure rate (> 10%)
- API errors (> 5% error rate)
- API quota approaching limit (> 80%)
- Slow API response times (> 2 seconds)

## Future Enhancements

1. **Geofencing**: Use Google Maps Geofencing API for automatic check-in/out
2. **Address Autocomplete**: Integrate Places API for address entry
3. **Route Optimization**: Use Directions API for visit routing
4. **Offline Support**: Cache geocoded coordinates for offline verification
5. **Historical Analysis**: Track location patterns for fraud detection
6. **Multi-Location Clients**: Support clients with multiple addresses

## References

- [Google Maps Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [PostGIS Point Type](https://www.postgresql.org/docs/current/datatype-geometric.html)

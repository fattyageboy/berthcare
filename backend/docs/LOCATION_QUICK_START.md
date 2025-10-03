# GPS Location Verification - Quick Start Guide

## Setup (5 minutes)

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Geocoding API**
4. Create API key in **Credentials**
5. Restrict key to Geocoding API only

### 2. Configure Environment

Add to `backend/.env`:

```bash
GOOGLE_MAPS_API_KEY=AIzaSyC...your-key-here
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

## Usage

### Option 1: Standalone Verification (Recommended)

Check location before allowing check-in:

```http
POST http://localhost:3002/api/visits/{visitId}/verify-location
Content-Type: application/json
X-User-Id: {userId}

{
  "location": {
    "latitude": 44.6488,
    "longitude": -63.5752,
    "accuracy": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location verified successfully",
  "data": {
    "verified": true,
    "distance": 45,
    "allowed_radius": 100
  }
}
```

### Option 2: Automatic Verification

Check-in automatically verifies location:

```http
POST http://localhost:3002/api/visits/{visitId}/check-in
Content-Type: application/json
X-User-Id: {userId}

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
    "visit_id": "...",
    "location_verified": true,
    "verification_distance": 45,
    "status": "in_progress"
  }
}
```

## How It Works

1. **Geocode Address**: Converts client address to GPS coordinates
2. **Calculate Distance**: Uses Haversine formula to measure distance
3. **Determine Area Type**: Checks if urban or rural
4. **Apply Radius**: 100m for urban, 500m for rural
5. **Return Result**: `verified: true` if within radius

## Testing

Use the examples in `test-examples.http`:

```bash
# Start the service
npm run dev

# Open test-examples.http in VS Code
# Use REST Client extension to send requests
```

## Troubleshooting

### "Google Maps API key not configured"

**Solution:** Add `GOOGLE_MAPS_API_KEY` to `.env` file

### "Geocoding failed: ZERO_RESULTS"

**Cause:** Invalid or incomplete client address  
**Solution:** Verify client address in database has all required fields

### "Geocoding failed: OVER_QUERY_LIMIT"

**Cause:** Exceeded API quota  
**Solution:** Check Google Cloud Console quota and billing

### Location verification fails but check-in succeeds

**Expected behavior:** Service uses graceful degradation  
**Action:** Check logs for error details, verify API key

## Best Practices

1. **Pre-verify**: Use standalone endpoint before check-in for better UX
2. **Show Distance**: Display distance to user if verification fails
3. **Cache Results**: Consider caching geocoded addresses
4. **Monitor Usage**: Track API calls in Google Cloud Console
5. **Handle Errors**: Always handle verification failures gracefully

## API Limits

- **Free Tier**: 40,000 requests/month
- **Paid Tier**: Higher limits based on billing
- **Rate Limit**: 50 requests/second

## Security

- ✅ API key in environment variables
- ✅ Never commit API key to git
- ✅ Restrict API key to Geocoding API
- ✅ Add IP restrictions in production
- ✅ Rotate keys regularly

## Next Steps

- Read full documentation: `LOCATION_VERIFICATION.md`
- Review architecture: `architecture-output.md` (lines 1069-1094)
- Check completion summary: `TASK_B14_COMPLETION_SUMMARY.md`

## Support

For issues or questions:
1. Check logs: `console.log` statements in service
2. Review documentation: `LOCATION_VERIFICATION.md`
3. Test with examples: `test-examples.http`
4. Verify API key: Google Cloud Console

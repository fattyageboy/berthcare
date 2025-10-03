# Visit Service - Quick Start Guide

## Overview

The Visit Service provides REST API endpoints for managing home care visits, including check-in, documentation, and completion workflows.

## Quick Start

### 1. Start the Service

```bash
cd backend
npm run dev
```

The service will start on port **3002** (configured in `.env`).

### 2. Test the Health Check

```bash
curl http://localhost:3002/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "service": "visit-service",
  "version": "1.0.0",
  "uptime": 123.45
}
```

## API Endpoints

### Base URL
```
http://localhost:3002/api
```

### Authentication
All endpoints require the `x-user-id` header:
```
x-user-id: <user-uuid>
```

## Common Use Cases

### 1. Get Today's Visits

```bash
curl -X GET "http://localhost:3002/api/visits?date_from=2024-01-15&date_to=2024-01-15" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440000"
```

### 2. Check In to a Visit

```bash
curl -X POST "http://localhost:3002/api/visits/<visit-id>/check-in" \
  -H "Content-Type: application/json" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "location": {
      "latitude": 51.0447,
      "longitude": -114.0719,
      "accuracy": 5.0
    },
    "timestamp": "2024-01-15T09:05:00Z"
  }'
```

### 3. Update Visit Documentation

```bash
curl -X PUT "http://localhost:3002/api/visits/<visit-id>/documentation" \
  -H "Content-Type: application/json" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "documentation": {
      "vital_signs": {
        "blood_pressure": "120/80",
        "heart_rate": 72,
        "temperature": 36.5
      }
    }
  }'
```

### 4. Complete a Visit

```bash
curl -X POST "http://localhost:3002/api/visits/<visit-id>/complete" \
  -H "Content-Type: application/json" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{
    "signature": "base64-signature-data"
  }'
```

## Status Flow

```
scheduled → in_progress → completed
    ↓            ↓
cancelled    missed
```

- **scheduled**: Visit is scheduled but not started
- **in_progress**: Visit has been checked in (via check-in endpoint)
- **completed**: Visit has been completed (via complete endpoint)
- **missed**: Visit was not attended
- **cancelled**: Visit was cancelled

## Validation Rules

### GPS Coordinates
- Latitude: -90 to 90
- Longitude: -180 to 180
- Accuracy: > 0 meters

### Vital Signs
- Heart Rate: 0-300 bpm
- Temperature: 30-45°C
- Blood Pressure: String format (e.g., "120/80")

### Date Ranges
- Must be ISO 8601 format (e.g., "2024-01-15T09:00:00Z")
- date_to must be after date_from

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ]
}
```

### Common Error Codes

- **400 Bad Request**: Validation errors or invalid status transitions
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Visit not found or doesn't belong to user
- **500 Internal Server Error**: Server error

## Testing with REST Client

If using VS Code with REST Client extension, open `test-examples.http` and click "Send Request" above any test case.

## Database Requirements

Ensure the following migrations are applied:

1. `1735000001_create-enum-types.js` - ENUM types
2. `1735000004_create-clients-table.js` - Clients table
3. `1735000005_create-visits-table.js` - Visits table

Run migrations:
```bash
npm run migrate
```

## Environment Variables

Required in `.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/berthcare

# Service Port
VISIT_SERVICE_PORT=3002

# Node Environment
NODE_ENV=development
```

## Troubleshooting

### Service won't start
1. Check database connection: `npm run migrate`
2. Verify environment variables in `.env`
3. Check port 3002 is not in use: `lsof -i :3002`

### Database connection errors
1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Run migrations: `npm run migrate`

### Validation errors
1. Check request body format matches examples
2. Verify all required fields are present
3. Check data types and ranges

### Visit not found errors
1. Verify visit ID is correct UUID
2. Ensure visit belongs to authenticated user
3. Check visit exists in database

## Development

### Run in development mode
```bash
npm run dev
```

### Type check
```bash
npm run type-check
```

### Lint
```bash
npm run lint
```

### Build
```bash
npm run build
```

## Documentation

- **Full API Documentation**: See `README.md` in this directory
- **Implementation Details**: See `backend/VISIT_SERVICE_IMPLEMENTATION.md`
- **Test Examples**: See `test-examples.http` in this directory

## Support

For issues or questions:
1. Check the full API documentation in `README.md`
2. Review test examples in `test-examples.http`
3. Check implementation notes in `VISIT_SERVICE_IMPLEMENTATION.md`

## Next Steps

After getting familiar with the visit service:
1. Review the full API documentation
2. Test all endpoints using the provided examples
3. Integrate with frontend mobile app
4. Implement integration tests (Task B15)
5. Add GPS service integration (Task B14)

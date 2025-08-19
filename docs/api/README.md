# API Endpoints Documentation

Complete reference for all API endpoints in the Flex Living Reviews Dashboard.

## Base URL
- **Development**: `http://localhost:5173/api`
- **Production**: `https://your-domain.vercel.app/api`

## API Domains

### Review Management (`/api/reviews`)
- [Review APIs](./reviews.md) - Complete review management endpoints
- **Endpoints**: 4 endpoints for CRUD operations, filtering, and batch updates

### Property Management (`/api/properties`, `/api/listings`)
- [Property APIs](./properties.md) - Property and listing management
- **Endpoints**: 3 endpoints for property data and property-specific reviews

### Dashboard Analytics (`/api/dashboard`)  
- [Dashboard APIs](./dashboard.md) - Analytics and business intelligence
- **Endpoints**: 4 endpoints for KPIs, trends, heatmaps, and rankings

### Google Integration (`/api/google`)
- [Google APIs](../integrations/google.md) - Places, Maps, and Geocoding
- **Endpoints**: 8 endpoints for place search, details, geocoding, and maps

### Hostaway Integration (`/api/hostaway`)
- [Hostaway APIs](../integrations/hostaway.md) - Property management sync
- **Endpoints**: 2 endpoints for connection testing and data sync

### Trend Analysis (`/api/trends`)
- **Endpoints**: 3 endpoints for anomaly detection, channel trends, and category analysis

### Data Export (`/api/export`)
- [Export APIs](./export.md) - Data export functionality
- **Endpoints**: 1 endpoint for CSV export

### System Utilities (`/api/audits`, `/api/config`, `/api/database`)
- [Audit APIs](./audit.md) - System auditing and utilities
- **Endpoints**: 4 endpoints for audits, configuration, and database operations

## Quick Reference

### Core Business Endpoints
```
GET  /api/reviews              # List reviews with filtering
GET  /api/reviews/stats        # Review statistics
POST /api/reviews/batch        # Batch review operations
GET  /api/properties           # List properties
GET  /api/dashboard/kpis       # Key performance indicators
GET  /api/dashboard/trends     # Trend analysis data
```

### Integration Endpoints
```
POST /api/google/places/search    # Search places
POST /api/google/places/details   # Get place details
POST /api/google/geocoding        # Geocode addresses
GET  /api/hostaway/test           # Test Hostaway connection
```

### Utility Endpoints
```
GET  /api/config               # Application configuration
GET  /api/audits               # System audit logs
GET  /api/export/reviews.csv   # Export reviews to CSV
POST /api/database/populate    # Populate sample data
```

## Common Response Patterns

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 25
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Pagination Pattern
```
GET /api/reviews?limit=25&offset=0&sort=submittedAt:desc
```

### Filtering Pattern
```
GET /api/reviews?channel=airbnb,booking&status=approved&dateFrom=2024-01-01
```

## HTTP Methods Usage

### GET Endpoints
Used for data retrieval with query parameters for filtering, sorting, and pagination.

### POST Endpoints
Used for data creation, batch operations, and external API calls requiring request bodies.

### PUT/PATCH Endpoints
Used for data updates (implemented in batch endpoints).

### DELETE Endpoints
Used for data removal (implemented in utility endpoints).

## Authentication & Security

### API Key Requirements
- Google API endpoints require valid `GOOGLE_PLACES_API_KEY` and `GOOGLE_MAPS_API_KEY`
- Hostaway endpoints require `HOSTAWAY_ACCOUNT_ID` and `HOSTAWAY_API_KEY`

### Input Validation
- All endpoints implement input validation
- Query parameters are sanitized and type-checked
- Request bodies are validated against expected schemas

### Error Handling
- Consistent error response format across all endpoints
- Proper HTTP status codes
- Detailed error messages for debugging

## Rate Limiting

### Google API Limits
- Respects Google API quotas and rate limits
- Implements proper error handling for quota exceeded scenarios

### Internal Rate Limiting
- No explicit rate limiting implemented
- Relies on Vercel platform limits for serverless functions

This documentation covers all 42+ API endpoints implemented in the system, organized by functional domain for easy navigation.

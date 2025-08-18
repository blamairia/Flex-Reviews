# Hostaway API Mock Documentation

## Individual Listing Endpoint

### GET `/api/listings/{id}/hostaway`

Returns comprehensive Hostaway-style property data for a specific listing.

#### Parameters

- **id** (required): The listing ID (path parameter)
- **city** (optional): City name for location-specific data generation (query parameter)

#### Example Requests

```bash
# Basic request (defaults to Paris)
GET /api/listings/404450/hostaway

# With city parameter
GET /api/listings/404450/hostaway?city=Paris
GET /api/listings/123456/hostaway?city=London
GET /api/listings/789012/hostaway?city=Barcelona
```

#### Response Format

```json
{
  "status": "success",
  "result": {
    "id": 404450,
    "propertyTypeId": 1,
    "name": "Property Name",
    "city": "Paris",
    "country": "France",
    "price": 151,
    "averageReviewRating": 8.5,
    "listingAmenities": [...],
    "listingImages": [...],
    // ... full Hostaway-compatible response
  }
}
```

#### Supported Cities

The API supports location-specific data for:

- **Paris** (France) - Default
- **London** (United Kingdom)
- **New York** (United States)
- **Barcelona** (Spain)
- **Amsterdam** (Netherlands)
- **Berlin** (Germany)
- **Rome** (Italy)

#### Location-Specific Data

When a city parameter is provided, the API automatically generates:

- Country and country code
- State/region information
- Timezone
- Coordinates (lat/lng)
- Postal codes
- Localized descriptions
- Transit information
- Neighborhood overviews

#### Error Responses

```json
// Missing listing ID
{
  "status": "error",
  "message": "Listing ID is required"
}

// Listing not found
{
  "status": "error", 
  "message": "Listing not found"
}

// Server error
{
  "status": "error",
  "message": "Failed to fetch listing data"
}
```

#### Response Fields

The response includes all standard Hostaway fields:

- **Basic Info**: id, name, description, thumbnailUrl
- **Location**: country, city, address, lat/lng, timezone
- **Pricing**: price, cleaningFee, taxes, discounts
- **Property Details**: bedrooms, bathrooms, capacity, amenities
- **Booking Settings**: check-in/out times, cancellation policy
- **Channel Integration**: Airbnb, VRBO, Booking.com settings
- **Media**: images with URLs and captions
- **Metadata**: tags, custom fields, listing settings

#### Integration Notes

This endpoint is designed to be a drop-in replacement for the actual Hostaway API for development and testing purposes. It:

- Uses real listing data from the local database when available
- Falls back to generated mock data for missing fields
- Maintains full compatibility with Hostaway's response structure
- Supports city-based localization for international properties

#### Example Usage

```javascript
// Fetch Paris property
const response = await fetch('/api/listings/404450/hostaway?city=Paris');
const property = await response.json();

if (property.status === 'success') {
  console.log('Property:', property.result.name);
  console.log('Location:', property.result.city, property.result.country);
  console.log('Amenities:', property.result.listingAmenities.length);
}
```

# Google APIs Integration

## Overview
The Flex Living Reviews Dashboard integrates with multiple Google APIs for location services, mapping, and place discovery functionality.

## Configured Google APIs

### Google Places API
**Purpose**: Place search, details, and reviews
**API Key**: `GOOGLE_PLACES_API_KEY`
**Documentation**: https://developers.google.com/maps/documentation/places/web-service

### Google Maps API  
**Purpose**: Static maps, geocoding, and mapping services
**API Key**: `GOOGLE_MAPS_API_KEY`
**Documentation**: https://developers.google.com/maps/documentation

### Google Maps JavaScript API
**Purpose**: Interactive maps and embedded map components
**API Key**: `GOOGLE_MAPS_API_KEY`
**Documentation**: https://developers.google.com/maps/documentation/javascript

## API Endpoints

### Place Search (`POST /api/google/places/search`)
**Source File**: `src/routes/api/google/places/search/+server.ts`

**Request Body**:
```typescript
{
  query: string;        // Search query
  location?: string;    // Location bias (lat,lng)
  radius?: number;      // Search radius in meters
  type?: string;        // Place type filter
}
```

**Google API Call**:
```
GET https://maps.googleapis.com/maps/api/place/textsearch/json
?query={query}
&location={location}
&radius={radius}
&type={type}
&key={GOOGLE_PLACES_API_KEY}
```

**Response Format**:
```typescript
{
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: { lat: number; lng: number; };
    };
    rating?: number;
    types: string[];
    photos?: Array<{ photo_reference: string; }>;
  }>;
  status: string;
}
```

### Place Details (`POST /api/google/places/details`)
**Source File**: `src/routes/api/google/places/details/+server.ts`

**Request Body**:
```typescript
{
  placeId: string;      // Google Place ID
  fields?: string;      // Comma-separated field list
}
```

**Google API Call**:
```
GET https://maps.googleapis.com/maps/api/place/details/json
?place_id={placeId}
&fields={fields}
&key={GOOGLE_PLACES_API_KEY}
```

**Default Fields**: `place_id,name,formatted_address,geometry,rating,reviews,types,photos,opening_hours,phone_number,website`

### Nearby Places (`POST /api/google/places/nearby`)
**Source File**: `src/routes/api/google/places/nearby/+server.ts`

**Request Body**:
```typescript
{
  location: string;     // "lat,lng" format
  radius: number;       // Search radius in meters
  type?: string;        // Place type filter
  keyword?: string;     // Search keyword
}
```

**Google API Call**:
```
GET https://maps.googleapis.com/maps/api/place/nearbysearch/json
?location={location}
&radius={radius}
&type={type}
&keyword={keyword}
&key={GOOGLE_PLACES_API_KEY}
```

### Place Reviews (`POST /api/google/reviews`)
**Source File**: `src/routes/api/google/reviews/+server.ts`

**Request Body**:
```typescript
{
  placeId: string;      // Google Place ID
}
```

**Implementation**: Uses Place Details API with `reviews` field to fetch Google reviews for a specific place.

### Geocoding (`POST /api/google/geocoding`)
**Source File**: `src/routes/api/google/geocoding/+server.ts`

**Request Body**:
```typescript
{
  address: string;      // Address to geocode
}
```

**Google API Call**:
```
GET https://maps.googleapis.com/maps/api/geocode/json
?address={address}
&key={GOOGLE_MAPS_API_KEY}
```

### Reverse Geocoding (`POST /api/google/geocoding/reverse`)
**Source File**: `src/routes/api/google/geocoding/reverse/+server.ts`

**Request Body**:
```typescript
{
  lat: number;          // Latitude
  lng: number;          // Longitude
}
```

**Google API Call**:
```
GET https://maps.googleapis.com/maps/api/geocode/json
?latlng={lat},{lng}
&key={GOOGLE_MAPS_API_KEY}
```

### Static Maps (`POST /api/google/maps/static`)
**Source File**: `src/routes/api/google/maps/static/+server.ts`

**Request Body**:
```typescript
{
  center: string;       // "lat,lng" center point
  zoom?: number;        // Zoom level (default: 15)
  size?: string;        // Image size (default: "400x300")
  markers?: string;     // Marker specifications
}
```

**Google API Call**:
```
GET https://maps.googleapis.com/maps/api/staticmap
?center={center}
&zoom={zoom}
&size={size}
&markers={markers}
&key={GOOGLE_MAPS_API_KEY}
```

### Find Place (`POST /api/google/places/find-place`)
**Source File**: `src/routes/api/google/places/find-place/+server.ts`

**Request Body**:
```typescript
{
  input: string;        // Search input
  inputType: 'textquery' | 'phonenumber';
  fields?: string;      // Fields to return
}
```

**Google API Call**:
```
GET https://maps.googleapis.com/maps/api/place/findplacefromtext/json
?input={input}
&inputtype={inputType}
&fields={fields}
&key={GOOGLE_PLACES_API_KEY}
```

## Frontend Integration

### GoogleMap Component
**Source File**: `src/lib/components/GoogleMap.svelte`

**Features**:
- Interactive embedded Google Maps
- Property location markers
- Nearby places discovery
- Custom marker icons based on place types
- Place information popups

**Implementation**:
```typescript
// Embedded map URL generation
function generateMapUrl(lat: number, lng: number, address: string) {
  const apiKey = GOOGLE_MAPS_API_KEY;
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${address}&center=${lat},${lng}&zoom=15&maptype=roadmap`;
}

// Nearby places discovery
async function findNearbyPlaces(lat: number, lng: number, type: string) {
  const response = await fetch('/api/google/places/nearby', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: `${lat},${lng}`,
      radius: 1000,
      type: type
    })
  });
  return response.json();
}
```

**Place Type Categories**:
```typescript
const placeCategories = [
  { name: 'Transit', type: 'transit_station', icon: '🚇' },
  { name: 'Groceries', type: 'grocery_or_supermarket', icon: '🛒' },
  { name: 'Restaurants', type: 'restaurant', icon: '🍽️' },
  { name: 'Pharmacy', type: 'pharmacy', icon: '💊' },
  { name: 'Coffee', type: 'cafe', icon: '☕' },
  { name: 'Banks', type: 'bank', icon: '🏦' }
];
```

### Testing Interface
**Source File**: `src/routes/google-test/+page.svelte`

**Test Functions**:
- Place search with various parameters
- Place details retrieval with custom fields
- Nearby places discovery with different types
- Address geocoding and coordinate resolution
- Reverse geocoding from coordinates
- Static map generation with markers
- Find place with text and phone inputs

## Configuration Management

### Environment Variables
```env
# Google Places API (required)
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Google Maps API (required)  
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### API Key Validation
**Source File**: `src/routes/api/config/+server.ts`

```typescript
// Configuration endpoint for frontend
export async function GET() {
  return new Response(JSON.stringify({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    hasGooglePlacesKey: !!GOOGLE_PLACES_API_KEY,
    hasGoogleMapsKey: !!GOOGLE_MAPS_API_KEY
  }));
}
```

### Error Handling

#### Common Error Scenarios
- **Invalid API Key**: Returns 403 Forbidden from Google APIs
- **Quota Exceeded**: Returns 429 Too Many Requests
- **Invalid Parameters**: Returns 400 Bad Request with validation errors
- **Place Not Found**: Returns 404 with ZERO_RESULTS status

#### Error Response Format
```json
{
  "error": {
    "message": "Google API error: INVALID_REQUEST",
    "status": "INVALID_REQUEST", 
    "details": {
      "error_message": "Missing required parameter: location"
    }
  }
}
```

## Usage Patterns

### Property Mapping Workflow
1. **Geocoding**: Convert property address to coordinates
2. **Map Display**: Show property location on interactive map
3. **Nearby Places**: Discover surrounding amenities and services
4. **Place Details**: Get detailed information about nearby places

### Place Discovery Workflow
1. **Search**: Text-based place search with location bias
2. **Filter**: Apply place type filters for relevant results
3. **Details**: Retrieve comprehensive place information
4. **Reviews**: Access Google reviews for place validation

### Address Validation Workflow
1. **Input**: Accept user-provided address
2. **Geocoding**: Validate and standardize address
3. **Reverse Geocoding**: Confirm location accuracy
4. **Storage**: Store validated coordinates and formatted address

## Rate Limiting & Quotas

### Google API Limits
- **Places API**: 100,000 requests per day (free tier)
- **Maps API**: 28,000 requests per month (free tier)
- **Geocoding API**: 40,000 requests per month (free tier)

### Best Practices
- Cache place details to reduce API calls
- Use appropriate field selections to minimize costs
- Implement client-side request throttling
- Monitor quota usage via Google Cloud Console

This Google APIs integration provides comprehensive location services, mapping capabilities, and place discovery functionality essential for property management applications.

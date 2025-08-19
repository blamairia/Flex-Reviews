# Google APIs Integration Test Dashboard

This is a comprehensive testing dashboard for Google APIs integration, similar to the `hostaway-test` implementation. It provides a user-friendly interface to test various Google APIs including Places, Reviews, Maps, and Geocoding services.

## Features

### 🗺️ Google Places API
- **Text Search**: Search for places using text queries
- **Place Details**: Get detailed information about specific places
- **Nearby Search**: Find places near a specific location
- **Rich Data**: Returns place IDs, ratings, reviews, photos, and business information

### ⭐ Google Reviews API
- **Place Reviews**: Fetch reviews for specific places using Place ID
- **Review Data**: Author information, ratings, text, timestamps, and translations
- **Rating Statistics**: Overall ratings and total review counts

### 🗺️ Google Maps API
- **Static Maps**: Generate static map images with markers
- **Customizable**: Configurable zoom, size, map type, and markers
- **URL Generation**: Returns map URLs for embedding or downloading

### 📍 Google Geocoding API
- **Forward Geocoding**: Convert addresses to coordinates
- **Reverse Geocoding**: Convert coordinates to addresses
- **Address Components**: Detailed address breakdowns
- **Location Data**: Precise latitude/longitude coordinates

## API Endpoints Structure

```
/api/google/
├── places/
│   ├── search/        # Text search for places
│   ├── details/       # Get detailed place information
│   └── nearby/        # Find nearby places
├── reviews/           # Get place reviews
├── geocoding/
│   ├── +server.ts     # Forward geocoding
│   └── reverse/       # Reverse geocoding
└── maps/
    └── static/        # Static map generation
```

## Usage Instructions

### 1. API Configuration
1. Navigate to `/google-test` in your application
2. Enter your Google API Key in the configuration section
3. Optionally load sample data using the "Load Sample Data" button

### 2. Testing Places API
- **Text Search**: Enter a search query (e.g., "Google Sydney")
- **Place Details**: Use a Place ID to get detailed information
- **Nearby Search**: Provide coordinates and radius to find nearby places

### 3. Testing Reviews API
- Use a Place ID to fetch reviews for that specific location
- Returns up to 5 most recent reviews with full details

### 4. Testing Maps API
- Generate static map images using coordinates
- Customize zoom level, size, and add markers

### 5. Testing Geocoding API
- **Forward**: Convert "1600 Amphitheatre Parkway, Mountain View, CA" to coordinates
- **Reverse**: Convert coordinates back to readable addresses

## Required Google API Key Permissions

Your Google API Key needs the following APIs enabled:

- **Places API** (for search, details, nearby)
- **Geocoding API** (for address/coordinate conversion)
- **Maps Static API** (for static map generation)

## Sample Test Data

The dashboard includes pre-configured sample data:
- **API Key**: `YOUR_GOOGLE_API_KEY_HERE` (replace with actual key)
- **Place ID**: `ChIJN1t_tDeuEmsRUsoyG83frY4` (Google Sydney Office)
- **Location**: Google Sydney (-33.8670522, 151.1957362)
- **Search Query**: "Google Sydney"

## Response Format

All API endpoints return structured JSON responses:

```json
{
  "status": "OK",
  "results": [...],
  "total_results": 5
}
```

Error responses include:
```json
{
  "error": "Error description",
  "details": "Additional error information"
}
```

## Integration Test Scenarios

The dashboard includes pre-built integration scenarios:

1. **🏨 Hotel Review Integration**
   - Search for hotels → Get details → Fetch reviews

2. **📍 Location & Map Integration**
   - Geocode address → Find nearby places → Generate map

3. **⭐ Review Sync Integration**
   - Sync Google reviews with local database

## Navigation

- Access the test dashboard via the sidebar navigation: "Google APIs Test"
- Use keyboard shortcuts: `Ctrl+S` to toggle sidebar
- Mobile-friendly responsive design

## File Structure

```
src/routes/
├── google-test/
│   ├── +layout.svelte     # Layout with AppShell integration
│   └── +page.svelte       # Main test dashboard
└── api/google/
    ├── places/
    │   ├── search/+server.ts
    │   ├── details/+server.ts
    │   └── nearby/+server.ts
    ├── reviews/+server.ts
    ├── geocoding/
    │   ├── +server.ts
    │   └── reverse/+server.ts
    └── maps/
        └── static/+server.ts
```

## Security Notes

- API keys are handled client-side for testing purposes
- In production, implement server-side API key management
- Consider rate limiting and quota management
- Validate all input parameters before API calls

## Troubleshooting

### Common Issues:
1. **Invalid API Key**: Ensure your key has the required permissions
2. **Quota Exceeded**: Check your Google Cloud Console for usage limits
3. **CORS Issues**: API calls are made server-side to avoid CORS problems
4. **Invalid Place ID**: Use the Text Search to find valid Place IDs first

### Testing Tips:
- Start with Text Search to find Place IDs
- Use Place Details to get comprehensive information
- Test with known locations for consistent results
- Check the browser console for detailed error messages

## Links

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Google Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding)
- [Google Maps Static API Documentation](https://developers.google.com/maps/documentation/maps-static)

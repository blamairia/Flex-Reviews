# Frontend Routes Documentation

## Overview
The Flex Living Reviews Dashboard frontend is built with SvelteKit and contains 65+ route files organized into functional areas.

## Main Application Routes

### Dashboard (`/`)
**Source File**: `src/routes/+page.svelte`
- **Purpose**: Main analytics dashboard with KPIs and overview metrics
- **Features**: Redirects to `/dashboard` for the full dashboard experience
- **Components Used**: Basic landing page

### Dashboard Analytics (`/dashboard`)
**Source Files**: 
- `src/routes/dashboard/+page.svelte`
- `src/routes/dashboard/+page.server.ts`

**Features**:
- Real-time KPI cards (total reviews, average rating, properties, channels)
- Interactive trend analysis charts
- Review volume heatmap
- Channel performance distribution
- Anomaly detection alerts
- Date range filtering

**Components Used**:
- `KpiCards.svelte` - Key performance indicators
- `TrendLineChart.svelte` - Time-series charts
- `ChannelPie.svelte` - Channel distribution
- `FilamentChannelChart.svelte` - Advanced channel visualization
- `FilamentTrendChart.svelte` - Trend analysis
- `FilamentTopListings.svelte` - Top properties widget

**Server-Side Data Loading**:
```typescript
// Loads initial dashboard data
const [statsRes, heatmapRes] = await Promise.all([
  fetch('/api/reviews/stats'),
  fetch('/api/dashboard/heatmap')
]);
```

### Review Management (`/reviews`)
**Source Files**:
- `src/routes/reviews/+page.svelte`
- `src/routes/reviews/+page.server.ts`

**Features**:
- Comprehensive review listing with pagination
- Advanced filtering by channel, rating, date, property
- Search functionality across guest names and comments
- Batch selection for web visibility management
- Individual review editing and management
- Export functionality

**Components Used**:
- `ReviewsTable.svelte` - Main review data table
- `ReviewCard.svelte` - Individual review display
- `FiltersBar.svelte` - Filtering interface

**URL Parameters**:
```typescript
{
  q?: string;           // Search query
  status?: string;      // Review status filter
  channel?: string;     // Channel filter
  listingId?: string;   // Property filter
  ratingMin?: number;   // Minimum rating
  ratingMax?: number;   // Maximum rating
  selectedForWeb?: boolean; // Web selection filter
  dateFrom?: string;    // Date range start
  dateTo?: string;      // Date range end
  sort?: string;        // Sort criteria
  offset?: number;      // Pagination offset
  limit?: number;       // Results per page
}
```

### Property Listings (`/listings`)
**Source File**: `src/routes/listings/+page.svelte`

**Features**:
- Grid view of all properties
- Property performance metrics
- Search and filtering capabilities
- Hostaway integration toggle
- Property status management

**Data Loading**:
```typescript
// Loads properties with optional Hostaway data
const response = await fetch('/api/properties?includeHostaway=true&limit=100');
```

### Individual Property Pages (`/listings/[id]`)
**Source Files**:
- `src/routes/listings/[id]/+page.svelte`
- `src/routes/listings/[id]/+page.server.ts`

**Features**:
- Detailed property information
- Property-specific review analytics
- Interactive Google Maps integration
- Amenities display with categorization
- Review insights and trends
- Nearby places discovery

**Components Used**:
- `GoogleMap.svelte` - Interactive property map
- `AmenitiesModal.svelte` - Amenities categorization
- `ReviewCard.svelte` - Property reviews
- `TrendLineChart.svelte` - Property-specific trends

**Server-Side Data Loading**:
```typescript
// Loads property details, reviews, and insights
const [propertyRes, reviewsRes, insightsRes] = await Promise.all([
  fetch(propertyUrl),
  fetch(reviewsUrl), 
  fetch(insightsUrl)
]);
```

## Testing & Development Routes

### Google API Testing (`/google-test`)
**Source File**: `src/routes/google-test/+page.svelte`

**Features**:
- Complete Google Places API testing interface
- Place search functionality
- Place details retrieval
- Nearby places discovery
- Geocoding and reverse geocoding
- Static map generation
- Find place functionality

**API Endpoints Tested**:
- `/api/google/places/search`
- `/api/google/places/details`
- `/api/google/places/nearby`
- `/api/google/reviews`
- `/api/google/geocoding`
- `/api/google/geocoding/reverse`
- `/api/google/maps/static`
- `/api/google/places/find-place`

### Hostaway Integration Testing (`/hostaway-test`)
**Source File**: `src/routes/hostaway-test/+page.svelte`

**Features**:
- Hostaway API connection testing
- Property data synchronization testing
- OAuth token management testing
- API endpoint validation
- Mock data fallback testing

**Test Functions**:
- Connection verification
- Property listing sync
- Data transformation validation
- Error handling verification

### Application Settings (`/settings`)
**Source Files**:
- `src/routes/settings/+page.svelte`
- `src/routes/settings/+server.ts`

**Features**:
- Database reset functionality
- Google Places API testing
- System audit log viewing
- Configuration management
- Development utilities

**Administrative Functions**:
```typescript
// Database reset (development only)
DELETE /settings

// Google API testing
GET /api/google/test?placeId=...

// Audit log retrieval
GET /api/audits?limit=10
```

## Dynamic Route Patterns

### Property Details Route
**Pattern**: `/listings/[id]`
- `id` parameter accepts property/listing identifiers
- Supports both internal IDs and external system IDs
- Handles 404 errors for non-existent properties

### API Route Integration
All frontend routes integrate with corresponding API endpoints:
- Client-side data fetching for dynamic content
- Server-side data loading for initial page data
- Real-time updates via API calls

## Route Navigation

### Main Navigation Structure
```
/dashboard          # Analytics overview
├── /reviews        # Review management
├── /listings       # Property overview
│   └── /[id]       # Individual property
├── /settings       # System settings
├── /google-test    # Google API testing
└── /hostaway-test  # Hostaway testing
```

### Breadcrumb Navigation
- Dashboard: Home > Dashboard
- Reviews: Home > Reviews
- Property List: Home > Properties
- Property Detail: Home > Properties > [Property Name]
- Settings: Home > Settings

## State Management

### URL State Management
- Filter states preserved in URL parameters
- Pagination state maintained across navigation
- Search queries persisted in browser history

### Component State
- Local component state for UI interactions
- Shared state via props and event emission
- Form state management with validation

## Performance Optimizations

### Route-Level Code Splitting
- Automatic code splitting by SvelteKit
- Lazy loading of route-specific components
- Optimized bundle sizes per route

### Data Loading Strategies
- Server-side rendering for initial page loads
- Client-side fetching for dynamic updates
- Caching strategies for repeated requests

### Progressive Enhancement
- Works without JavaScript for basic functionality
- Enhanced interactivity with JavaScript enabled
- Fallback strategies for API failures

## Responsive Design

### Mobile Optimization
- Responsive layouts across all routes
- Touch-friendly interaction patterns
- Mobile-specific navigation adaptations

### Accessibility Features
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Focus management for dynamic content

This frontend architecture provides a comprehensive user interface for property management with intuitive navigation and powerful functionality across all major use cases.

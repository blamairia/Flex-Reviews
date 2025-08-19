# Review Management API Endpoints

## Overview
The Review API provides comprehensive functionality for managing guest reviews including filtering, statistics, and batch operations.

## Endpoints

### GET /api/reviews
Retrieve reviews with advanced filtering, sorting, and pagination.

**Source File**: `src/routes/api/reviews/+server.ts`

**Query Parameters**:
```typescript
{
  q?: string;                    // Search query for guest name or comment
  status?: string;               // Comma-separated status values
  channel?: string;              // Comma-separated channel values  
  listingId?: string;            // Filter by specific property
  ratingMin?: number;            // Minimum rating (0-5)
  ratingMax?: number;            // Maximum rating (0-5)
  selectedForWeb?: string;       // '1' for selected, '0' for not selected
  dateFrom?: string;             // Start date (YYYY-MM-DD)
  dateTo?: string;               // End date (YYYY-MM-DD)
  sort?: string;                 // Sort field:direction (e.g., 'submittedAt:desc')
  limit?: number;                // Results per page (default: 25)
  offset?: number;               // Pagination offset (default: 0)
}
```

**Response Format**:
```typescript
{
  reviews: ReviewWithDetails[];
  total: number;
  page: number;
  limit: number;
  filters: {
    availableChannels: string[];
    availableStatuses: string[];
    dateRange: { min: string; max: string; };
  };
}
```

**ReviewWithDetails Interface**:
```typescript
interface ReviewWithDetails {
  id: string;
  listingId: string;
  guestName: string;
  rating: number;
  comment: string | null;
  type: string;
  channel: string;
  submittedAt: string;
  selectedForWeb: boolean;
  listingName: string;
}
```

**Example Request**:
```bash
GET /api/reviews?channel=airbnb,booking&ratingMin=4&limit=10&sort=submittedAt:desc
```

**Example Response**:
```json
{
  "reviews": [
    {
      "id": "rev_001",
      "listingId": "prop_001",
      "guestName": "John Smith",
      "rating": 4.5,
      "comment": "Great location and clean apartment",
      "type": "guest",
      "channel": "airbnb",
      "submittedAt": "2024-01-15T10:30:00Z",
      "selectedForWeb": true,
      "listingName": "Downtown Apartment"
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 10,
  "filters": {
    "availableChannels": ["airbnb", "booking", "direct", "google"],
    "availableStatuses": ["approved", "pending", "rejected"],
    "dateRange": {
      "min": "2024-01-01",
      "max": "2024-12-31"
    }
  }
}
```

### GET /api/reviews/stats
Get comprehensive review statistics and analytics.

**Source File**: `src/routes/api/reviews/stats/+server.ts`

**Query Parameters**:
```typescript
{
  dateFrom?: string;  // Start date for statistics
  dateTo?: string;    // End date for statistics
}
```

**Response Format**:
```typescript
{
  totalReviews: number;
  averageRating: number;
  channelBreakdown: Array<{
    channel: string;
    count: number;
    avgRating: number;
    percentage: number;
  }>;
  ratingDistribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  recentTrends: Array<{
    date: string;
    count: number;
    avgRating: number;
  }>;
  topListings: Array<{
    id: string;
    name: string;
    reviewCount: number;
    avgRating: number;
  }>;
}
```

**Example Request**:
```bash
GET /api/reviews/stats?dateFrom=2024-01-01&dateTo=2024-12-31
```

### POST /api/reviews/batch
Perform batch operations on multiple reviews.

**Source File**: `src/routes/api/reviews/batch/+server.ts`

**Request Body**:
```typescript
{
  action: 'select' | 'unselect' | 'delete';
  reviewIds: string[];
}
```

**Response Format**:
```typescript
{
  success: boolean;
  updated: number;
  message: string;
}
```

**Example Request**:
```bash
POST /api/reviews/batch
Content-Type: application/json

{
  "action": "select",
  "reviewIds": ["rev_001", "rev_002", "rev_003"]
}
```

**Example Response**:
```json
{
  "success": true,
  "updated": 3,
  "message": "Successfully updated 3 reviews"
}
```

### GET /api/listings/[id]/reviews
Get reviews for a specific property/listing.

**Source File**: `src/routes/api/listings/[id]/reviews/+server.ts`

**Parameters**:
- `id` (path parameter): Listing ID

**Query Parameters**:
```typescript
{
  selectedOnly?: boolean;  // Only return web-selected reviews
}
```

**Response Format**:
```typescript
{
  reviews: ReviewWithDetails[];
  listing: {
    id: string;
    name: string;
    avgRating: number;
    reviewCount: number;
  };
}
```

**Example Request**:
```bash
GET /api/listings/prop_001/reviews?selectedOnly=true
```

## Service Layer Integration

### ReviewService Class
**Source File**: `src/lib/db/reviewService.ts`

**Key Methods**:
```typescript
class ReviewService {
  static async getReviews(filters: ReviewFilters): Promise<ReviewWithDetails[]>
  static async getReviewStats(dateFrom?: string, dateTo?: string): Promise<ReviewStats>
  static async updateBatch(action: string, reviewIds: string[]): Promise<number>
  static async getReviewsByListing(listingId: string, selectedOnly?: boolean): Promise<ReviewWithDetails[]>
}
```

## Database Queries

### Review Filtering Query Pattern
```typescript
// Base query with joins
let query = db
  .select({
    id: reviews.id,
    listingId: reviews.listingId,
    guestName: reviews.guestName,
    rating: reviews.rating,
    comment: reviews.comment,
    type: reviews.type,
    channel: reviews.channel,
    submittedAt: reviews.submittedAt,
    selectedForWeb: reviews.selectedForWeb,
    listingName: listings.name,
  })
  .from(reviews)
  .leftJoin(listings, eq(reviews.listingId, listings.id));

// Apply filters conditionally
if (channel.length > 0) {
  query = query.where(inArray(reviews.channel, channel));
}

if (dateFrom) {
  query = query.where(gte(reviews.submittedAt, dateFrom));
}

// Apply sorting and pagination
query = query
  .orderBy(sortDirection === 'asc' ? asc(sortField) : desc(sortField))
  .limit(limit)
  .offset(offset);
```

### Statistics Aggregation
```typescript
// Channel breakdown aggregation
const channelStats = await db
  .select({
    channel: reviews.channel,
    count: count(reviews.id),
    avgRating: avg(reviews.rating),
  })
  .from(reviews)
  .groupBy(reviews.channel);
```

## Frontend Integration

### Component Usage
The Review API is primarily consumed by:
- `src/routes/reviews/+page.svelte` - Main review management interface
- `src/lib/components/ReviewsTable.svelte` - Tabular review display
- `src/lib/components/FiltersBar.svelte` - Review filtering interface
- `src/routes/dashboard/+page.svelte` - Dashboard statistics

### Fetch Patterns
```typescript
// Frontend API call pattern
const response = await fetch('/api/reviews?' + params.toString());
const data = await response.json();

// Batch operation pattern
const response = await fetch('/api/reviews/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'select', reviewIds: selectedIds })
});
```

## Error Handling

### Common Error Scenarios
- **400 Bad Request**: Invalid query parameters or request body
- **404 Not Found**: Listing not found for listing-specific endpoints
- **500 Internal Server Error**: Database connection or query errors

### Error Response Format
```json
{
  "error": {
    "message": "Invalid rating range",
    "code": "INVALID_PARAMETERS",
    "details": {
      "field": "ratingMin",
      "value": -1,
      "expected": "0-5"
    }
  }
}
```

This API provides comprehensive review management capabilities with efficient filtering, statistics, and batch operations for the property management dashboard.

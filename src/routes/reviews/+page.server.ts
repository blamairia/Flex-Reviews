import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ url, fetch }) => {
  try {
    // Extract query parameters for server-side filtering
    const searchParams = url.searchParams;
    const apiUrl = new URL('/api/reviews', url.origin);
    
    // Forward all query parameters to the API
    for (const [key, value] of searchParams.entries()) {
      apiUrl.searchParams.set(key, value);
    }
    
    // Set defaults if not provided
    if (!apiUrl.searchParams.has('limit')) {
      apiUrl.searchParams.set('limit', '25');
    }
    if (!apiUrl.searchParams.has('offset')) {
      apiUrl.searchParams.set('offset', '0');
    }
    if (!apiUrl.searchParams.has('sort')) {
      apiUrl.searchParams.set('sort', 'submittedAt:desc');
    }

    console.log(`📊 Loading reviews with filters: ${apiUrl.search}`);
    
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Reviews API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load reviews');
    }
    
    console.log(`✅ Loaded ${data.reviews.length} reviews from API`);
    
    return {
      reviews: data.reviews,
      pagination: data.pagination || {
        total: data.reviews.length,
        limit: 25,
        offset: 0,
        hasMore: false
      },
      filters: Object.fromEntries(searchParams.entries())
    };
  } catch (error) {
    console.error('❌ Error loading reviews:', error);
    
    return {
      reviews: [],
      pagination: {
        total: 0,
        limit: 25,
        offset: 0,
        hasMore: false
      },
      filters: {},
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

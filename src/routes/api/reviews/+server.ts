import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ReviewService } from '$lib/db/reviewService';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    
    // Extract all filter parameters
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status')?.split(',').filter(Boolean) || [];
    const channel = searchParams.get('channel')?.split(',').filter(Boolean) || [];
    const listingId = searchParams.get('listingId') || '';
    const ratingMin = parseInt(searchParams.get('ratingMin') || '0');
    const ratingMax = parseInt(searchParams.get('ratingMax') || '5');
    const selectedForWeb = searchParams.get('selectedForWeb');
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const sort = searchParams.get('sort') || 'submittedAt:desc';
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔄 Fetching reviews from database...');
    console.log('📋 Filters:', { q, status, channel, listingId, ratingMin, ratingMax, selectedForWeb, dateFrom, dateTo, sort, limit, offset });
    
    // Build filters object for the service
    const filters = {
      searchQuery: q,
      status: status.length > 0 ? status : undefined,
      channel: channel.length > 0 ? channel : undefined,
      listingId: listingId || undefined,
      ratingMin,
      ratingMax,
      selectedForWeb: selectedForWeb !== null ? selectedForWeb === 'true' : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    };

    // Parse sort parameter
    const [sortField, sortOrder] = sort.split(':');
    const orderBy = {
      field: sortField as 'submittedAt' | 'overallRating' | 'listingName',
      direction: (sortOrder || 'desc') as 'asc' | 'desc'
    };

    // Get reviews from database
    const result = await ReviewService.getFilteredReviews(filters, {
      limit,
      offset,
      orderBy
    });
    
    console.log(`✅ Returning ${result.reviews.length} reviews (${result.total} total)`);
    
    return json({
      success: true,
      reviews: result.reviews,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total
      }
    });

  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reviews: [],
        pagination: {
          total: 0,
          limit: 25,
          offset: 0,
          hasMore: false
        }
      },
      { status: 500 }
    );
  }
};


import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ReviewService } from '$lib/db/reviewService';

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const { id } = params;
    const selectedOnly = url.searchParams.get('selectedOnly') === 'true';
    
    console.log(`🔍 Fetching reviews for listing ${id} (selectedOnly: ${selectedOnly})`);
    
    let reviews;
    if (selectedOnly) {
      // Get only selected/approved reviews for public display
      reviews = await ReviewService.getSelectedReviewsForProperty(id);
    } else {
      // Get all reviews for this property
      reviews = await ReviewService.getReviewsForProperty(id);
    }
    
    console.log(`✅ Found ${reviews.length} reviews for listing ${id}`);
    
    return json({
      success: true,
      listing: { id, name: `Property ${id}` },
      reviews,
      count: reviews.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching listing reviews:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reviews: [],
        count: 0
      },
      { status: 500 }
    );
  }
};

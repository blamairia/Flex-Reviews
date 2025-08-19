import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ReviewService } from '$lib/db/reviewService';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return json(
        { success: false, error: 'Property ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching selected reviews for property: ${id}`);

    // Get selected reviews for this property
    const selectedReviews = await ReviewService.getSelectedReviewsForProperty(id);
    
    // Get property info from the first review if available
    const propertyName = selectedReviews.length > 0 ? selectedReviews[0].listingName : `Property ${id}`;

    console.log(`✅ Found ${selectedReviews.length} selected reviews for ${propertyName}`);

    return json({
      success: true,
      listing: {
        id,
        name: propertyName
      },
      reviews: selectedReviews
    });

  } catch (error) {
    console.error('❌ Error fetching property reviews:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        listing: { id: params.id, name: `Property ${params.id}` },
        reviews: []
      },
      { status: 500 }
    );
  }
};
